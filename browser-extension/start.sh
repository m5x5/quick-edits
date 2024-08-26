source scripts/logging_lib.sh

extension_id="bfcjldhcnibiijidbbeddopkpljkahja"
binary_path=""

# check NODE_ENV == production otherwise prompt for extension id
if [ "$NODE_ENV" = "production" ]; then
    log_verbose "Production mode"
else
    log_verbose "Development mode"
    log_info "Enter extension id: "
    read -r extension_id
fi

###region Functions

function build_native_search {
    cd ../native-search || exit
    go install
    go build

    binary_path=$(pwd)"/native-search"

    cd ../browser-extension || exit
}

function copy_manifest {

    if [ ! -f "./examples/nmh-manifest.json" ]; then
        log_error "Aborting because ./examples/nmh-manifest.json does not exist"
        exit 1
    fi

    if [ ! -d "/Library/Google/Chrome/NativeMessagingHosts" ]; then
        log_error "Aborting because /Library/Google/Chrome/NativeMessagingHosts does not exist"
        exit 1
    fi

    file_content=$(cat ./examples/nmh-manifest.json)

    file_content="${file_content//__REPLACE_ABSOLUTE_PATH__/${binary_path}}"
    file_content="${file_content//__REPLACE_EXTENSION_ID__/${extension_id}}"

    log_info "Admin permissions required to add manifest file /Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json"
    log_info "${file_content}" | sudo tee /Library/Google/Chrome/NativeMessagingHosts/com.quick_edits.native_search.json > /dev/null

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