declare module "@axe-core/react" {
  import * as React from "react";
  import * as ReactDOM from "react-dom";
  const axe: (react: typeof React, reactDOM: typeof ReactDOM, timeout?: number, config?: unknown) => void;
  export default axe;
}
