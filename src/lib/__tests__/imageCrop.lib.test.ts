import { describe, expect, it } from "vitest";

import {
  DEFAULT_IMAGE_CROP,
  clampImageCrop,
  getImageCropBox,
  nudgeImageCrop,
} from "lib/imageCrop.lib";

describe("getImageCropBox", () => {
  it("fills the square with a centred square image", () => {
    expect(getImageCropBox(DEFAULT_IMAGE_CROP, 400, 400)).toEqual({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    });
  });

  it("fits a tall image's width and centres it, like object-fit cover", () => {
    const box = getImageCropBox(DEFAULT_IMAGE_CROP, 100, 200);
    expect(box.width).toBeCloseTo(100);
    expect(box.height).toBeCloseTo(200);
    expect(box.left).toBeCloseTo(0);
    expect(box.top).toBeCloseTo(-50);
  });

  it("shows the top of a tall image when its centre is near the top", () => {
    const box = getImageCropBox(
      { position: { x: 0.5, y: 0.25 }, scale: 1 },
      100,
      200,
    );
    expect(box.top).toBeCloseTo(0);
  });

  it("zooms around the chosen centre", () => {
    const box = getImageCropBox(
      { position: { x: 0.75, y: 0.5 }, scale: 2 },
      200,
      200,
    );
    expect(box.width).toBeCloseTo(200);
    expect(box.height).toBeCloseTo(200);
    // The image's point at 75% of its width sits in the middle of the square.
    expect(box.left + 0.75 * box.width).toBeCloseTo(50);
    expect(box.top).toBeCloseTo(-50);
  });
});

describe("clampImageCrop", () => {
  it("keeps the square inside the image", () => {
    expect(
      clampImageCrop({ position: { x: 1.4, y: -0.2 }, scale: 1 }, 200, 100),
    ).toEqual({ position: { x: 0.75, y: 0.5 }, scale: 1 });
  });

  it("keeps the zoom between 1 and 2", () => {
    expect(
      clampImageCrop({ ...DEFAULT_IMAGE_CROP, scale: 0.5 }, 1, 1).scale,
    ).toBe(1);
    expect(
      clampImageCrop({ ...DEFAULT_IMAGE_CROP, scale: 2.0000001 }, 1, 1).scale,
    ).toBe(2);
  });

  it("leaves the position alone while the image's size is unknown", () => {
    const crop = { position: { x: 2, y: 2 }, scale: 1 };
    expect(clampImageCrop(crop, 0, 0)).toEqual(crop);
  });
});

describe("nudgeImageCrop", () => {
  it("moves by a share of the visible part and stops at the edge", () => {
    const moved = nudgeImageCrop(DEFAULT_IMAGE_CROP, 100, 200, { x: 0, y: 1 });
    expect(moved.position.y).toBeCloseTo(0.55);
    let crop = DEFAULT_IMAGE_CROP;
    for (let i = 0; i < 20; i++) {
      crop = nudgeImageCrop(crop, 100, 200, { x: 0, y: 1 });
    }
    expect(crop.position.y).toBeCloseTo(0.75);
    expect(
      nudgeImageCrop(DEFAULT_IMAGE_CROP, 100, 200, { x: 1, y: 0 }).position.x,
    ).toBe(0.5);
  });
});
