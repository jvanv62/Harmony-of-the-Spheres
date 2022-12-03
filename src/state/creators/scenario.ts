import { AppState } from "../reducers";
import { getObjFromArrByKeyValuePair } from "../../utils";
import { getOrbit, elementsToVectors } from "../../physics/utils";
import {
  ScenarioActionTypes,
  SET_SCENARIO,
  MODIFY_SCENARIO_PROPERTY,
  MODIFY_MASS_PROPERTY,
  AddMass,
  ADD_MASS,
  DELETE_MASS,
  ScenarioProperty,
  MassProperty,
} from "../types/scenario";
import { Action, Dispatch } from "redux";
import { ThunkAction } from "redux-thunk";
import { findCurrentSOI } from "../../physics/spacecraft/lambert";
import work from "webworkify-webpack";

export const modifyScenarioProperty = (
  ...scenarioProperties: ScenarioProperty[]
): ThunkAction<void, AppState, void, Action> => (
  dispatch: Dispatch<ScenarioActionTypes>
) =>
  scenarioProperties.forEach((scenarioProperty) =>
    dispatch({
      type: MODIFY_SCENARIO_PROPERTY,
      payload: {
        key: scenarioProperty.key,
        value: scenarioProperty.value,
      },
    })
  );

export const resetScenario = () =>
  modifyScenarioProperty(
    ...Object.entries(
      JSON.parse(sessionStorage.getItem("currentScenario") || "{}")
    ).map(([key, value]: [string, any]) => ({
      key,
      value,
    })),
    {
      key: "reset",
      value: true,
    }
  );

export const modifyMassProperty = (
  ...massProperties: MassProperty[]
): ThunkAction<void, AppState, void, Action> => (
  dispatch: Dispatch<ScenarioActionTypes>
) =>
  massProperties.forEach((massProperty) =>
    dispatch({
      type: MODIFY_MASS_PROPERTY,
      payload: massProperty,
    })
  );

export const addMass = (
  payload: AddMass
): ThunkAction<void, AppState, void, Action> => (
  dispatch: Dispatch<ScenarioActionTypes>,
  getState: () => AppState
) => {
  const scenario = getState().scenario;

  let primary;

  if (payload.primary !== "Barycenter") {
    primary = getObjFromArrByKeyValuePair(
      scenario.masses,
      "name",
      payload.primary
    );
  } else {
    primary = scenario.barycenterData;
  }

  dispatch({
    type: ADD_MASS,
    payload: getOrbit(primary, payload.secondary, scenario.g),
  });
};

export const deleteMass = (name: string): ScenarioActionTypes => ({
  type: DELETE_MASS,
  name,
});

export const setScenario = (scenario: ScenarioState): ScenarioActionTypes => {
  if (scenario.type === "Exoplanets") {
    const [primary] = scenario.masses;
    return {
      type: SET_SCENARIO,
      scenario: {
        ...scenario,
        masses: elementsToVectors(
          primary,
          scenario.masses.slice(1),
          scenario.g
        ),
      },
    };
  } else {
    return {
      type: SET_SCENARIO,
      scenario,
    };
  }
};

export const getTrajectory = (
  soiTree: SOITree,
  currentSOI: MassType,
  correction = false,
  applyTrajectory = true
): ThunkAction<void, AppState, void, Action> => async (
  dispatch: Dispatch<ScenarioActionTypes>,
  getState: () => AppState
) => {
  const scenario = getState().scenario;

  const originalPlayState = scenario.playing ? true : false;
  const originalTrailsState = scenario.trails ? true : false;

  modifyScenarioProperty(
    {
      key: "trails",
      value: false,
    },
    {
      key: "playing",
      value: false,
    }
  )(dispatch, getState);

  const trajectoryCruncher = work(
    require.resolve("../../physics/spacecraft/trajectoryCruncher")
  );

  const currentSOIChildOf = findCurrentSOI(
    getObjFromArrByKeyValuePair(scenario.masses, "name", currentSOI.name),
    soiTree,
    scenario.masses
  );

  let referenceMass: MassType;

  if (currentSOIChildOf.name === scenario.trajectoryTarget)
    referenceMass = currentSOI;
  else
    referenceMass = findCurrentSOI(
      getObjFromArrByKeyValuePair(
        scenario.masses,
        "name",
        scenario.trajectoryTarget
      ),
      soiTree,
      scenario.masses
    );

  const rotatedScenario = scenario.masses.map((mass: MassType) => ({
    ...mass,
    x: referenceMass.x - mass.x,
    y: referenceMass.y - mass.y,
    z: referenceMass.z - mass.z,
    vx: referenceMass.vx - mass.vx,
    vy: referenceMass.vy - mass.vy,
    vz: referenceMass.vz - mass.vz,
  }));

  const getTrajectory = () =>
    new Promise<{ x: number; y: number; z: number; p?: MassProperty }[]>(
      (resolve) => {
        trajectoryCruncher.addEventListener(
          "message",
          ({
            data: { trajectory },
          }: {
            data: {
              trajectory: [Vector, { x: number; y: number; z: number; p: any }];
            };
          }) => {
            resolve(trajectory);
          }
        );

        trajectoryCruncher.postMessage({
          integrator: scenario.integrator,
          g: scenario.g,
          dt: scenario.dt,
          tol: scenario.tol,
          minDt: scenario.minDt,
          maxDt: scenario.maxDt,
          elapsedTime: scenario.elapsedTime,
          masses: rotatedScenario,
          departure: scenario.elapsedTime,
          arrival: correction
            ? scenario.trajectoryRendevouz.p.t
            : scenario.elapsedTime + scenario.trajectoryTargetArrival,
          target: scenario.trajectoryTarget,
          primary: referenceMass.name,
          a: scenario.a,
          e: scenario.e,
          i: scenario.i,
          w: scenario.w,
          o: scenario.o,
          tof: correction
            ? scenario.trajectoryTargetArrival - scenario.elapsedTime
            : scenario.trajectoryTargetArrival,
        });
      }
    );

  const [trajectory, rendevouz] = await getTrajectory();

  const [spacecraft] = scenario.masses;

  trajectoryCruncher.terminate();

  if (applyTrajectory) {
    modifyScenarioProperty({
      key: "masses",
      value: rotatedScenario,
    })(dispatch, getState);

    modifyMassProperty(
      {
        name: spacecraft.name,
        key: "vx",
        value: trajectory.x,
      },
      {
        name: spacecraft.name,
        key: "vy",
        value: trajectory.y,
      },
      {
        name: spacecraft.name,
        key: "vz",
        value: trajectory.z,
      }
    )(dispatch, getState);
  }

  modifyScenarioProperty(
    {
      key: "trajectoryRendevouz",
      value: correction
        ? {
            ...rendevouz,
            p: { ...rendevouz.p, t: scenario.trajectoryRendevouz.p.t },
          }
        : rendevouz,
    },
    { key: "playing", value: originalPlayState },
    { key: "trails", value: originalTrailsState }
  )(dispatch, getState);
};
