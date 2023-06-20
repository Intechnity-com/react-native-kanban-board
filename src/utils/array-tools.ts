export function moveElementToNewIndex<T>(array: T[], element: T, newIndex: number): T[] {
  const oldIndex = array.indexOf(element);
  if (oldIndex === -1) {
      return array;
  }

  array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]!);
  return array;
}
