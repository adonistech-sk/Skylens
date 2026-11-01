# Points check.mjs at a toolchain unpacked by setup.mjs. Source this file, or set
# the two variables yourself.
: "${SKYLENS_TOOLS:?Set SKYLENS_TOOLS to the directory passed to setup.mjs}"
export SKYLENS_TOOLCHAIN="$(ls -d "$SKYLENS_TOOLS"/tree/LocalApp/Programs/Swift/Toolchains/*/usr | head -1)"
export SKYLENS_WASM_SDK="$(ls -d "$SKYLENS_TOOLS"/wasm-sdk/*.artifactbundle/*/wasm32-unknown-wasip1 | head -1)"
