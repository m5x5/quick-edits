#!/bin/sh

# Resolve the real path of the script (following symbolic links)
script_path="$(realpath "$0")"
script_dir="$(dirname "$script_path")"

. "$script_dir/scripts/logging_lib.sh"

extension_id="bfcjldhcnibiijidbbeddopkpljkahja"

native_search_dir="$(cd "$script_dir/../native-search" && pwd)"

binary_path="${native_search_dir}/native_search"

log_info "${native_search_dir}"

# check NODE_ENV == production otherwise prompt for extension id
if [ "$NODE_ENV" = "production" ]; then
    log_verbose "Production mode"
else
    log_verbose "Development mode"
    log_info "Enter extension id: "
    read -r extension_id
fi

###region Functions

build_native_search() {
   # Build and install the Go project
       if ! (cd "$native_search_dir" && go install && go build); then
           echo "Failed to build and install Go project"
           exit 1
       fi
}
copy_manifest () {

    if [ ! -f "$script_dir/examples/nmh-manifest.json" ]; then
        log_error "Aborting because ./examples/nmh-manifest.json does not exist"
        exit 1
    fi

    if [ ! -d "/Library/Google/Chrome/NativeMessagingHosts" ]; then
        log_error "Aborting because /Library/Google/Chrome/NativeMessagingHosts does not exist"
        exit 1
    fi

    build_native_search

    file_content=$(cat "$script_dir/examples/nmh-manifest.json")
    file_content=$(echo "$file_content" | sed "s|__REPLACE_ABSOLUTE_PATH__|${binary_path}|g; s|__REPLACE_EXTENSION_ID__|${extension_id}|g")

    log_info "${file_content}"

    log_info "Admin permissions required to add manifest file /Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json"
    echo "${file_content}" | sudo tee /Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json > /dev/null

    # cat /Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json
    # ls /Library/Google/Chrome/NativeMessagingHosts/
}

###endregion

###region OS handling
unameOut="$(uname -s)"

case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    CYGWIN*)    machine=Cygwin;;
    MINGW*)     machine=MinGw;;
    MSYS_NT*)   machine=Git;;
    *)          machine="UNKNOWN:${unameOut}"
esac

if [ "${machine}" = "Linux" ]; then
    log_error "Linux not yet supported for automatic setup. Try the manual setup instead :)"
elif [ "${machine}" = "Mac" ]; then
    log_verbose "Running Mac setup"
    # check if chrome native messaging host is installed
    if [ -d "/Library/Google/Chrome/NativeMessagingHosts" ]; then
        log_verbose "Native messaging folder exists"
        copy_manifest
    else
        echo "Native messaging folder installed"
    fi
else
    log_error "This os is not yet supported for automatic setup. Try the manual setup instead :)"
fi
###endregion