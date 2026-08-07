import { describe, expect, it, vi, beforeEach } from "vitest";

const imageCompressionMock = vi.fn();
vi.mock("browser-image-compression", () => ({ default: (...args: unknown[]) => imageCompressionMock(...args) }));

import { compressImageIfNeeded } from "./compress-image";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("compressImageIfNeeded", () => {
  beforeEach(() => {
    imageCompressionMock.mockReset();
  });

  it("skips SVGs — rasterizing a vector image would destroy it", async () => {
    const file = makeFile("logo.svg", "image/svg+xml", 500 * 1024);
    const result = await compressImageIfNeeded(file);
    expect(result.didCompress).toBe(false);
    expect(result.file).toBe(file);
    expect(imageCompressionMock).not.toHaveBeenCalled();
  });

  it("skips animated GIFs — canvas compression only keeps the first frame", async () => {
    const file = makeFile("meme.gif", "image/gif", 500 * 1024);
    const result = await compressImageIfNeeded(file);
    expect(result.didCompress).toBe(false);
    expect(imageCompressionMock).not.toHaveBeenCalled();
  });

  it("skips files already under the size threshold", async () => {
    const file = makeFile("icon.png", "image/png", 50 * 1024);
    const result = await compressImageIfNeeded(file);
    expect(result.didCompress).toBe(false);
    expect(imageCompressionMock).not.toHaveBeenCalled();
  });

  it("compresses a large JPEG and reports the size reduction", async () => {
    const original = makeFile("photo.jpg", "image/jpeg", 8 * 1024 * 1024);
    const smaller = makeFile("photo.jpg", "image/jpeg", 1 * 1024 * 1024);
    imageCompressionMock.mockResolvedValue(smaller);

    const result = await compressImageIfNeeded(original);

    expect(imageCompressionMock).toHaveBeenCalledWith(
      original,
      expect.objectContaining({ maxWidthOrHeight: 2560, useWebWorker: true }),
    );
    expect(result.didCompress).toBe(true);
    expect(result.originalBytes).toBe(8 * 1024 * 1024);
    expect(result.finalBytes).toBe(1 * 1024 * 1024);
    expect(result.file.type).toBe("image/jpeg");
  });

  it("keeps the original when compression would make it bigger", async () => {
    const original = makeFile("photo.png", "image/png", 300 * 1024);
    const bigger = makeFile("photo.png", "image/png", 400 * 1024);
    imageCompressionMock.mockResolvedValue(bigger);

    const result = await compressImageIfNeeded(original);

    expect(result.didCompress).toBe(false);
    expect(result.file).toBe(original);
  });

  it("falls back to the original file if compression throws", async () => {
    const original = makeFile("photo.webp", "image/webp", 5 * 1024 * 1024);
    imageCompressionMock.mockRejectedValue(new Error("canvas unavailable"));

    const result = await compressImageIfNeeded(original);

    expect(result.didCompress).toBe(false);
    expect(result.file).toBe(original);
  });
});
