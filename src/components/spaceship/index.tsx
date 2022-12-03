import React, { ReactElement, useState, useEffect, Fragment } from "react";
import Dropdown from "../Dropdown";
import Slider from "../Slider";
import Button from "../Button";
import {
  modifyScenarioProperty,
  getTrajectory
} from "../../state/creators/scenario";
import "./Spaceship.less";
import {
  constructSOITree,
  findCurrentSOI,
  stateToKepler,
  radiusSOI
} from "../../physics/spacecraft/lambert";
import { getObjFromArrByKeyValuePair } from "../../utils";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import Modal from "../Modal";
import NumberPicker from "../NumberPicker";

import ThrustControls from "./ThrustControls";

//We could do this with the H3 class
//But seems a bit excessive importing it just to get the magnitude of the velocity vector.

const getVelocityMagnitude = (v: Vector) =>
  Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

interface CockpitDashboardProps {
  scenario: ScenarioState;
  modifyScenarioProperty: typeof modifyScenarioProperty;
  getTrajectory: typeof getTrajectory;
}

export default ({
  scenario,
  modifyScenarioProperty,
  getTrajectory
}: CockpitDashboardProps): ReactElement => {
  const [spacecraftMass] = scenario.masses;
  const target = getObjFromArrByKeyValuePair(
    scenario.masses,
    "name",
    scenario.trajectoryTarget
  );

  const [gui, setGUI] = useState({
    trajectory: true,
    statistics: true
  });

  const [spacecraft, setSpacecraft] = useState({
    tree: constructSOITree(scenario.masses),
    currentSOI: findCurrentSOI(
      spacecraftMass,
      constructSOITree(scenario.masses),
      scenario.masses
    ),
    scenario: scenario.name,
    orbitalElements: { a: 0, e: 0, i: 0, argP: 0, lAn: 0 },
    targetSOI: 0,
    velocity: 0,
    relativeVelocity: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scenario.name !== spacecraft.scenario)
        setSpacecraft({
          ...spacecraft,
          tree: constructSOITree(scenario.masses),
          scenario: scenario.name
        });

      const currentSOI = findCurrentSOI(
        spacecraftMass,
        spacecraft.tree,
        scenario.masses
      );

      if (
        currentSOI.name !== spacecraft.currentSOI.name &&
        currentSOI.name === "Sun"
      ) {
        getTrajectory(spacecraft.tree, spacecraft.currentSOI, true);
      }

      const orbitalElements = stateToKepler(
        {
          x: currentSOI.x - spacecraftMass.x,
          y: currentSOI.y - spacecraftMass.y,
          z: currentSOI.z - spacecraftMass.z
        },
        {
          x: currentSOI.vx - spacecraftMass.vx,
          y: currentSOI.vy - spacecraftMass.vy,
          z: currentSOI.vz - spacecraftMass.vz
        },
        39.5 * spacecraft.currentSOI.m
      );

      orbitalElements.a = parseFloat(orbitalElements.a.toFixed(5));
      orbitalElements.e = parseFloat(orbitalElements.e.toFixed(5));
      orbitalElements.i = parseFloat(orbitalElements.i.toFixed(5));
      orbitalElements.argP = parseFloat(orbitalElements.argP.toFixed(5));
      orbitalElements.lAn = parseFloat(orbitalElements.lAn.toFixed(5));

      const { name } = currentSOI;

      if (name !== spacecraft.currentSOI.name) {
        modifyScenarioProperty({
          key: "rotatingReferenceFrame",
          value: name
        });

        if (name === scenario.trajectoryTarget) {
          modifyScenarioProperty({
            key: "dt",
            value: 5.28496533062743064e-10
          });
        }
      }

      setSpacecraft({
        ...spacecraft,
        orbitalElements,
        currentSOI,
        targetSOI: radiusSOI(scenario.masses[1], target),
        velocity: parseFloat(
          getVelocityMagnitude({
            x: spacecraftMass.vx,
            y: spacecraftMass.vy,
            z: spacecraftMass.vz
          }).toFixed(5)
        ),
        relativeVelocity:
          getVelocityMagnitude({
            x: currentSOI.vx,
            y: currentSOI.vy,
            z: currentSOI.vz
          }) -
          getVelocityMagnitude({
            x: spacecraftMass.vx,
            y: spacecraftMass.vy,
            z: spacecraftMass.vz
          })
      });

      modifyScenarioProperty({
        key: "soi",
        value: name
      });
    }, 16);
    return () => {
      clearTimeout(timer);
    };
  }, [spacecraft]);

  return (
    <Fragment>
      {!gui.statistics && (
        <Button
          cssClassName="button trajectory"
          callback={() => setGUI({ ...gui, statistics: true })}
        >
          <Fragment>
            <i className="fas fa-bar-chart" />
            Statistics
          </Fragment>
        </Button>
      )}
      {!gui.trajectory && (
        <Button
          cssClassName="button trajectory-planner"
          callback={() => setGUI({ ...gui, trajectory: true })}
        >
          <Fragment>
            <i className="fas fa-space-shuttle" />
            Trajectory
          </Fragment>
        </Button>
      )}

      <ReactCSSTransitionGroup
        transitionName="fade"
        transitionEnterTimeout={250}
        transitionLeaveTimeout={250}
      >
        {gui.statistics && (
          <Modal
            callback={() => setGUI({ ...gui, statistics: false })}
            modalWrapperCssClass="statistics-modal-wrapper"
          >
            <h3>Statistics</h3>
            <table className="trajectory-table">
              <tbody>
                <tr>
                  <td>Primary</td>
                  <td>{spacecraft.currentSOI.name}</td>
                </tr>
                <tr>
                  <td>
                    <i>υ</i>
                  </td>
                  <td>{spacecraft.velocity}</td>
                </tr>
                <tr>
                  <td>
                    <i>a</i>
                  </td>
                  <td>{spacecraft.orbitalElements.a}</td>
                </tr>
                <tr>
                  <td>
                    <i>e</i>
                  </td>
                  <td>{spacecraft.orbitalElements.e}</td>
                </tr>
                <tr>
                  <td>
                    <i>i</i>
                  </td>
                  <td>{spacecraft.orbitalElements.i}</td>
                </tr>
                <tr>
                  <td>
                    <i>Ω</i>
                  </td>
                  <td>{spacecraft.orbitalElements.lAn}</td>
                </tr>
                <tr>
                  <td>
                    <i>ϖ</i>
                  </td>
                  <td>{spacecraft.orbitalElements.argP}</td>
                </tr>
              </tbody>
            </table>
          </Modal>
        )}
      </ReactCSSTransitionGroup>

      <ReactCSSTransitionGroup
        transitionName="fade"
        transitionEnterTimeout={250}
        transitionLeaveTimeout={250}
      >
        {gui.trajectory && (
          <Modal
            callback={() => setGUI({ ...gui, trajectory: false })}
            modalWrapperCssClass="trajectory-modal-wrapper"
          >
            <h3 className="cockpit-dashboard-header">Trajectory Planner</h3>
            <label>Target </label>
            <Dropdown
              selectedOption={scenario.trajectoryTarget}
              dropdownWrapperCssClassName="tabs-dropdown-wrapper"
              selectedOptionCssClassName="selected-option cockpit-element"
              optionsWrapperCssClass="options"
            >
              {scenario.masses.map((mass: MassType) => (
                <div
                  data-name={mass.name}
                  key={mass.name}
                  onClick={() =>
                    modifyScenarioProperty({
                      key: "trajectoryTarget",
                      value: mass.name
                    })
                  }
                >
                  {mass.name}
                </div>
              ))}
            </Dropdown>
            <label className="top">Time of Flight</label>
            <Slider
              payload={{ key: "trajectoryTargetArrival" }}
              value={scenario.trajectoryTargetArrival}
              callback={modifyScenarioProperty}
              max={scenario.maxTOF}
              min={scenario.minTOF}
              step={(scenario.maxTOF - scenario.minTOF) / 100}
            />
            <Button
              cssClassName="button box top"
              callback={() =>
                spacecraftMass.spacecraft &&
                getTrajectory(spacecraft.tree, spacecraft.currentSOI)
              }
            >
              Set Trajectory
            </Button>
          </Modal>
        )}
      </ReactCSSTransitionGroup>
      <ThrustControls
        spacecraftDirections={scenario.spacecraftDirections}
        modifyScenarioProperty={modifyScenarioProperty}
        thrustOn={scenario.thrustOn}
      />
      <div className="number-picker-wrapper">
        <NumberPicker
          numbers={[
            5.28496533062743064e-10,
            0.00000001,
            0.000001,
            0.00001,
            0.0001
          ]}
          callback={modifyScenarioProperty}
          icon="fas fa-chevron-right"
          payload={{ key: "dt" }}
          payloadKey="value" initialIndex={0} /> // JVV- set InitialIndex, lint error correction
      </div>
    </Fragment>
  );
};
