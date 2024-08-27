#!/bin/sh

# Define log levels as simple variables instead of an associative array
FATAL=0
ERROR=1
WARN=2
INFO=3
DEBUG=4
VERBOSE=5

# Set default log level
_log_level=$INFO

set_log_level() {
  case "$1" in
    FATAL) _log_level=$FATAL ;;
    ERROR) _log_level=$ERROR ;;
    WARN)  _log_level=$WARN ;;
    INFO)  _log_level=$INFO ;;
    DEBUG) _log_level=$DEBUG ;;
    VERBOSE) _log_level=$VERBOSE ;;
    *) echo "Invalid log level: $1" ;;
  esac
}

log_execute() {
  level=$1
  shift
  if [ "$_log_level" -ge "$level" ]; then
    "$@"
  else
    "$@" >/dev/null 2>&1
  fi
}

log_fatal() {
  if [ "$_log_level" -ge "$FATAL" ]; then
    echo "[FATAL]: $*"
    exit 1
  fi
}

log_error() {
  if [ "$_log_level" -ge "$ERROR" ]; then
    echo "[ERROR]: $*"
  fi
}

log_warn() {
  if [ "$_log_level" -ge "$WARN" ]; then
    echo "[WARN]: $*"
  fi
}

log_info() {
  if [ "$_log_level" -ge "$INFO" ]; then
    echo "$*"
  fi
}

log_debug() {
  if [ "$_log_level" -ge "$DEBUG" ]; then
    echo "[DEBUG]: $*"
  fi
}

log_verbose() {
  if [ "$_log_level" -ge "$VERBOSE" ]; then
    echo "[VERBOSE]: $*"
  fi
}
