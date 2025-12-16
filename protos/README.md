generate python code for app from root of repo. they end up in app/generated

    python -m grpc.tools.protoc -I protos --python_betterproto2_out=app/generated protos/*.proto

These protos are copied directly from those in cranebot3-firmware
the reason a submodule was not used is that I plan to eventually move to a monorepo.
for now, just keep it in sync