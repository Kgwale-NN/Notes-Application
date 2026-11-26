export async function withDeadline<T>(
  operation: Promise<T>,
  milliseconds: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    });

    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
