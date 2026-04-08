# Imitation Learning

Imitation learning refers to the process of recording actions performed on a robot by remote control (teleoperation) and training a model to imitate those actions.
Datasets contain video, sensors, proprioception, and recorded actions, and models learn to predict the actions from the observations.

Stringman supports imitation learning via the [Lerobot](https://huggingface.co/lerobot) framework.

## Setup

In order for stringman to record episodes or make use of trained policies, the [nf-robot package](https://pypi.org/project/nf-robot/) must be installed with the optional `dev` dependency. With your stringman virtualenv active, run

    pip install --upgrade "nf-robot[host,dev]"

Additionally, you need an account on Huggingface (a repository for open source datasets) It is free, and your recorded data will be stored there, and will be visible to the public unless you pay for a private account. Unfortunately lerobot makes it pretty inconvenient to completely avoid uploading the data to huggingface, but it is possible in theory and it is a planned feature, but as of now, stringman only records the gripper camera so it's not much of an issue.

After making your account, run the following from the terminal where your virtualenv is active.
It will promt you for a token, when you must create one time in your huggingface account settings. Follow the instructions printed at the prompt

    hf auth login

After this is complete, when you start `stringman-headless` in this enviroment, it will be possible to start recording and eval sessions using the web UI.
A session runs as a subprocess of stringman-headless and is cleaned up automatically. Stringman does not start one automatically, but only at your request using the UI. It is only possible to record or evaluate policies while one is active.

## Starting a recording session

Establish a connection to your robot and confirm basic functionality. Confirm all components are connected. Make some small movements with your gamepad to confirm it is responsive. Perform a quick cal to make sure the position estimate is not way off.

The click the `Start Lerobot` button in the top bar. A panel will open. To record a dataset you must specify a repo id with the format `huggingface_username/dataset_name` You can choose any dataset name you like. If it is new, we will create it. If it exists and is the exact same format, we will append episodes to it.

![](images/learn/start_session.png){ loading=lazy, width=45% }

Click start and in a moment, you will hear 'ready' spoken by the browser. Auditory feedback is used to make it easier to record episodes while keeping your eyes on the robot.

### Considering the dataset scope

For the best results from immitation learning you should keep your motions deliberate and clean. Whatever you record, the policy learns to immitate.

!!! tip "Record with Swing Cancellation"

    It is reccomended to always record data with swing cancellation turned on. (swing cancellation can be toggled with the switch in the UI or by clicking the left stick). Likewise run your eval with it turned on as well.

Keep episodes short and focused on the task. A typical episode would be to start over an object, grasp it, and lift it off the ground.

 * Turn on every light you have in the room. Better lighting almost always gives better results
 * Start by grasping a single object and doing the same thing with it each time. 50 episodes will be sufficient for an ACT model as long as there is no extra variety in the data.
 * Introduce additional variety one degree at a time. for example. Starting with the fingers both open and closed. starting with the object in different orientations, or adding different colors of objects. the more variety, the more data you should collect.

### Recording your first episode.

Press `Start` on the gamepad or the start episode button in the lerobot panel.

move the robot to perform a simple task, then press start again to end the episode. Auditory feedback lets you know you've ended the episode and how many you've recorded this session, Just after ending an episode, a few seconds of additional processing is necessary for ffmpeg to catch up and finish writing the video file. When this is complete, you will hear "ready" and the lerobot button's icon will change from an array of dots, to an open circle. Now you can start the next episode.

You can discard an episode during recording and it will be ended and not included in the dataset. Press `select` on the gamepad to discard an episode, or press the stop button in the UI.

### Ending the recording

To save the episodes and upload to huggingface, click the  button to bring up the Lerobot Session dialog. Click Finalize. The session will process any remaining data and upload to huggingface.

![](images/learn/active_session.png){ loading=lazy, width=45% }

There is a [dataset viewer](https://huggingface.co/spaces/lerobot/visualize_dataset) where you can review the recorded episodes.

### Troubleshooting

If any error occurs during recording, the session ends, but the recorded data is often salvagable since it's still present on your drive (wherever stringman-headless is running) and can still be uploaded with

If you see `FileExistsError: [Errno 17] File exists: '/home/nhn/.cache/huggingface/lerobot/naavox/test-dataset'` when trying to start a session, this means that the previous time you started a session with that repo id, it never got to the upload state and and the repo id was never registerd with huggingface, but just in case there is some valid data in there, it's refusing to overwrite the folder. If you know it's empty just delete it.

If the UI state is out of sync somehow and says there's a session where you know there is not, refresh the page.

## Training

### Locally

Train an ACT policy on a recorded Stringman dataset.

```
lerobot-train \
  --dataset.repo_id=<repo id of recorded data> \
  --policy.type=act \
  --output_dir=outputs/train/<unique name for this run> \
  --job_name=act_c \
  --policy.device=cuda \
  --wandb.enable=false \
  --policy.repo_id=<new repo id where you want the trained model uploaded> \
  --steps=100000 \
  --batch_size=200 \
  --save_freq=20000
```

To maximize the use of your hardware, you should set batch_size as high as possible without running out of VRAM
run `nvtop` to see a visual indicator of your GPU's vram utiliztion. If you see it below 90%, increase batch_size. if the training command exits with a memory error, decrease it.

100k steps will run overnight on an Nvidia 4090 or better. 50k is also acceptable. Though you almost certainly won't get better results by training longer than 100k. If results are poor, it's always the data quality.

### In Colab

Huggingface provides Google Colab notebooks containing commands and instructions for training policies in the cloud. Currently the process is identical to that of training for the SO-101 arm.

Train ACT model [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/huggingface/notebooks/blob/main/lerobot/training-act.ipynb)

## Evaluating a Policy (Letting the AI drive your robot)

Similar to starting a recording session, start an evaluation session with the other button, supplying the repo id of the trained model.
The repo id is the value you provided to the `--policy.repo_id` argument to the training command.

A session will begin that works exactly like recording but with no auditory feedback. 

Pressing start activates inference and the robot will act autonomously according to the policy until start is pressed again.

for best results, replicate the conditions that were present during recording. If you recorded with swing cancellation on, turn that on for evaluation.
Turn on the same lights that were on during recording, and remove from view any extra textures or distractions.

Make sure that the stringman-headless motion controller is running the exact same *major version* of nf-robot that was used when the dataset was recorded.

Recalibration of the robot between recording and eval, in theory, should not make a difference, but avoid doing that if you want to know for sure what caused a given change of behavior.