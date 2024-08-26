declare -A _log_levels=([FATAL]=0 [ERROR]=1 [WARN]=2 [INFO]=3 [DEBUG]=4 [VERBOSE]=5)
declare -i _log_level=3

set_log_level() {
  level="${1:-INFO}"
  _log_level="${_log_levels[$level]}"
}

log_execute() {
  level=${1:-INFO}
  if (( $1 >= ${_log_levels[$level]} )); then
    "${@:2}" >/dev/null
  else
    "${@:2}"
  fi
}

log_fatal()   { (( _log_level >= _log_levels[FATAL] ))   && echo "FATAL  $*";  }
log_error()   { (( _log_level >= _log_levels[ERROR] ))   && echo "ERROR  $*";  }
log_warning() { (( _log_level >= _log_levels[WARNING] )) && echo "WARNING  $*";  }
log_info()    { (( _log_level >= _log_levels[INFO] ))    && echo "$*";  }
log_debug()   { (( _log_level >= _log_levels[DEBUG] ))   && echo "DEBUG  $*";  }
log_verbose() { (( _log_level >= _log_levels[VERBOSE] )) && echo "VERBOSE $*"; }

# functions for logging command output
log_debug_file()   { (( _log_level >= _log_levels[DEBUG] ))   && [[ -f $1 ]] && echo "=== command output start ===" && cat "$1" && echo "=== command output end ==="; }
log_verbose_file() { (( _log_level >= _log_levels[VERBOSE] )) && [[ -f $1 ]] && echo "=== command output start ===" && cat "$1" && echo "=== command output end ==="; }