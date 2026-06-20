"""Success-metric definitions — the single source of truth for the scoreboard.

Both the public scoreboard (nf-viz/scoreboard.html, via GET /api/metrics) and the
employee monthly-score entry page (/employee/metrics) key off these. Each metric
is stored long-format in the `metric_measurements` table as one append-only row
per recorded value, so adding or retiring a metric here needs no schema change.
"""

SECTION_ROBOT = "Robot Evaluation"
SECTION_MODEL = "Model Evaluation"

# Order here is the order the entry page prompts and the scoreboard renders.
METRIC_DEFINITIONS = [
    {
        "key": "installation_problems",
        "section": SECTION_ROBOT,
        "title": "problems during install",
        "prompt": (
            "Starting from a fresh image, install the Stringman software, set up "
            "the robot, and run it following the same instructions a customer "
            "would. Count how many problems came up during install."
        ),
        "unit": "problems during install",
        "input_kind": "int",
    },
    {
        "key": "positioning_accuracy",
        "section": SECTION_ROBOT,
        "title": "Positioning Accuracy",
        "prompt": (
            "Freshly calibrate the robot. Pick ten random starting locations in "
            "the work area and command a move to a known location — e.g. placing "
            "the fingers around a marble on a stick exactly one meter above the "
            "origin. Enter the average distance to target after the move, in centimeters."
        ),
        "unit": "cm avg distance to target",
        "input_kind": "float",
    },
    {
        "key": "move_linearity",
        "section": SECTION_ROBOT,
        "title": "Move Linearity",
        "prompt": (
            "Command the robot to move in a horizontal line at constant speed "
            "across the work area, in a clear area with nothing on the floor. "
            "Using the laser rangefinder, enter the average deviation from the "
            "target altitude, in centimeters."
        ),
        "unit": "cm avg altitude deviation",
        "input_kind": "float",
    },
    {
        "key": "uptime_hours",
        "section": SECTION_ROBOT,
        "title": "Uptime",
        "prompt": (
            "Enter the average number of hours the robot can stay turned on "
            "before something makes it unusable (currently overheating "
            "Raspberry Pis)."
        ),
        "unit": "hours before failure",
        "input_kind": "float",
    },
    {
        "key": "grasping_success",
        "section": SECTION_MODEL,
        "title": "Grasping Success",
        "prompt": (
            "From a collection of 20 objects that do not occur in the training "
            "data, challenge the robot to pick up each object starting from a "
            "close position. It succeeds if it lifts the object securely within "
            "30 seconds. Enter how many of the 20 were grasped."
        ),
        "unit": "objects grasped",
        "input_kind": "int",
    },
    {
        "key": "target_identification",
        "section": SECTION_MODEL,
        "title": "Target Identification",
        "prompt": (
            "From an overhead picture of a room (same kind of cameras) containing "
            "20 objects absent from the training data, have the model output "
            "overlays pointing out the targets it plans to pick up. Enter the "
            "number of intended targets positively identified minus the number of "
            "false positives."
        ),
        "unit": "identified targets",
        "input_kind": "int",
    },
    {
        "key": "room_cleanup",
        "section": SECTION_MODEL,
        "title": "Room Cleanup Test",
        "prompt": (
            "Throw 20 objects from each handled category (laundry, toys, trash) "
            "around the work area and activate the 'pick and place' job with a "
            "single button, as a non-technical customer would. After 30 minutes, "
            "enter how many items ended up in the correct bin."
        ),
        "unit": "items in correct bin after 30 min",
        "input_kind": "int",
    },
]

# Fast lookup / validation set of recognized metric keys.
METRIC_KEYS = frozenset(m["key"] for m in METRIC_DEFINITIONS)
