// Vinext exits immediately after static prerendering. On Windows this can
// interrupt libuv handle cleanup. Let successful builds drain naturally;
// preserve every explicit failure exit and uncaught error.
const exit = process.exit.bind(process);
process.exit = (code) => {
  if (process.platform === 'win32' && Number(code ?? 0) === 0) {
    process.exitCode = 0;
    return;
  }
  return exit(code);
};
