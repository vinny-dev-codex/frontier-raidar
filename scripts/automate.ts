import { runDailyAutomation } from "../src/lib/automation";

runDailyAutomation()
  .then((result) => console.log(JSON.stringify(result)))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
