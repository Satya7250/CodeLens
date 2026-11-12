export function isValidRepositoryId(id: string): boolean {
  return /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id);
}
