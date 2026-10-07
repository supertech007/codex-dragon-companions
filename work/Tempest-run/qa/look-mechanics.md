# Tempest look mechanics

Keep the four feet and lower torso as the stable anchor. The eyes lead each gaze, then the head and upper neck turn or bend; wings and tail follow only slightly. Cyan lightning-like scale markings and both five-segment indicator strips remain fixed to their original surfaces and do not change sides.

Cardinals in viewer coordinates: `000` raises the snout and gaze upward with more throat visible; `090` turns the snout clearly screen-right, hiding more of the far eye; `180` dips the muzzle and eyes down; `270` turns the snout clearly screen-left, hiding more of the far eye. Intermediate directions interpolate evenly between these poses. Preserve the friendly face and navy/cobalt palette. Do not rotate the whole dragon or add breath, bolts, sparks, or other effects during looking.

Motion budget: each 22.5-degree step makes a small, even change in pupil gaze, head yaw/pitch, and upper-neck bend. Keep scale, baseline, feet, indicator positions, wings, and tail registration stable across the loop.
