import {
  planFlight,
  propagateOrbitalElements,
  keplerToState,
  stateToKepler
} from "./lambert";
import { getObjFromArrByKeyValuePair } from "../../utils";

/*

                                                   ,:
                                                 ,' |
                                                /   :
                                             --'   /
                                             \/ />/
                                             / <//_\
                                          __/   /
                                          )'-. /
                                          ./  :\
                                           /.' '
                                         '/'
                                         +
                                        '
                                      `.
                                  .-"-
                                 (    |
                              . .-'  '.
                             ( (.   )8:
                         .'    / (_  )
                          _. :(.   )8P  `
                      .  (  `-' (  `.   .
                       .  :  (   .a8a)
                      /_`( "a `a. )"'
                  (  (/  .  ' )=='
                 (   (    )  .8"   +
                   (`'8a.( _(   (
                ..-. `8P    ) `  )  +
              -'   (      -ab:  )
            '    _  `    (8P"Ya
          _(    (    )b  -`.  ) +
         ( 8)  ( _.aP" _a   \( \   *
       +  )/    (8P   (88    )  )
          (a:f   "     `"       `


*/

export default function worker(self) {
  self.onmessage = async ({
    data: {
      integrator,
      g,
      dt,
      tol,
      minDt,
      maxDt,
      elapsedTime,
      masses,
      departure,
      arrival,
      target,
      primary,
      a,
      e,
      i,
      w,
      o,
      tof
    }
  }) => {
    const [spacecraft] = masses;
    let targetMass = getObjFromArrByKeyValuePair(masses, "name", target);

    let primaryM = getObjFromArrByKeyValuePair(masses, "name", primary).m;

    const pm = getObjFromArrByKeyValuePair(masses, "name", primary);

    const orbElem1 = stateToKepler(
      {
        x: targetMass.x,
        y: targetMass.y,
        z: targetMass.z
      },
      {
        x: targetMass.vx,
        y: targetMass.vy,
        z: targetMass.vz
      },
      39.5 * primaryM
    );

    const orbElem2 = propagateOrbitalElements(
      orbElem1,
      arrival,
      39.5 * primaryM
    );
    const newStateVectors = keplerToState(orbElem2, 39.5 * primaryM);

    //To speed things up, don't include masses that don't significantly perturb our target

    const trajectoryGenerator = () => {
      return new Promise(resolve => {
        targetMass = getObjFromArrByKeyValuePair(masses, "name", target);

        targetMass.x = newStateVectors.posRel.x;
        targetMass.y = newStateVectors.posRel.y;
        targetMass.z = newStateVectors.posRel.z;

        targetMass.vx = newStateVectors.velRel.x;
        targetMass.vy = newStateVectors.velRel.y;
        targetMass.vz = newStateVectors.velRel.z;

        resolve(planFlight(arrival, spacecraft, targetMass, g * primaryM));
      });
    };

    const [velocities] = await trajectoryGenerator();

    self.postMessage({
      trajectory: [
        {
          x: velocities.initVel.x,
          y: velocities.initVel.y,
          z: velocities.initVel.z
        },
        {
          x: velocities.finalVel.x,
          y: velocities.finalVel.y,
          z: velocities.finalVel.z,
          p: { ...targetMass, t: arrival }
        }
      ]
    });
  };
}
