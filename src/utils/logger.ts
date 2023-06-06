export function logError(err: any) {
  const asError = err as Error;
  const asString = err as string;

  if (asError != null) {
    console.log(asError.message);
    console.log(asError.stack);
  }
  else if (asString != null) {
    console.log(asString);
  }
  else {
    console.log(JSON.stringify(err));
  }
}
