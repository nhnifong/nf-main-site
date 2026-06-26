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
            "the robot, and run it according to the <a href='/docs/arp_install_guide/'>user guide</a>."
            "Count how many problems came up during install."
        ),
        "unit": "problems during install",
        "input_kind": "int",
    },
    {
        "key": "positioning_accuracy",
        "section": SECTION_ROBOT,
        "title": "Positioning Accuracy",
        "prompt": (
            "Place all four route card tags on the floor name side up. ",
            "Run the debug command \"goalseek\". The robot will visit each of the "
            "four tags in turn until it has visited each one three times. After it "
            "leaves a tag, move that tag to a new place in order to more thoroughly "
            "cover the work area. Tags may be on beds or furniture as well as the floor. "
            "If any collision, interruption, or error occurs, restart the test."
            "Report the RMS deviation from the console log in centimeters."
        ),
        "unit": "cm avg distance to target",
        "input_kind": "float",
    },
    {
        "key": "move_linearity",
        "section": SECTION_ROBOT,
        "title": "Move Linearity",
        "prompt": (
            "In a clear area with nothing on the floor, run the debug command \"linear\"."
            "And report the RMS deviation from the console log in centimeters."
        ),
        "unit": "RMS deviation in cm",
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
