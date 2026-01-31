import shutil
from pathlib import Path
from importlib.resources import files
import nf_robot.protos

def main():
    # Locate the protos inside the installed pip package
    # This works even if nf_robot is in a virtualenv or installed as editable
    proto_source = files(nf_robot.protos)
    
    # Define where TypeScript needs them
    dest_dir = Path("./src/temp_protos") 
    
    # Copy
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    dest_dir.mkdir(parents=True)

    print(f"Extracting protos from {proto_source} to {dest_dir}...")
    
    # Iterate over files in the package and copy .proto files
    for file in proto_source.iterdir():
        if file.name.endswith(".proto"):
            shutil.copy(file, dest_dir / file.name)
            print(f"  - Copied {file.name}")

if __name__ == "__main__":
    main()