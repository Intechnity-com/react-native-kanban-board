export function logError(err: any) {
  const asError = err as Error;
  const asString = err as string;

  console.error(err);

  if (asError != null) {
    console.error(asError.message);
    console.error(asError.stack);
  }
  else if (asString != null) {
    console.error(asString);
  }
  else {
    console.error(JSON.stringify(err));
  }
}
