export async function loadRandomImage(): Promise<File> {
  const IMAGE_COUNT = 5;

  const randomIndex = Math.floor(Math.random() * IMAGE_COUNT) + 1;
  const imagePath = `/ascii-init/${randomIndex}.webp`;

  try {
    const response = await fetch(imagePath);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const file = new File([blob], `init-${randomIndex}.webp`, {
      type: blob.type,
    });
    return file;
  } catch (error) {
    console.error(`Failed to load random image: ${error}`);
    throw error;
  }
}
