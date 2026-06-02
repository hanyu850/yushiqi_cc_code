import { describe, expect, test } from "bun:test";
import { join } from "path";
import {
  getXDGStateHome,
  getXDGCacheHome,
  getXDGDataHome,
  getUserBinDir,
} from "../xdg";

// Build expected paths using path.join to be platform-aware
const s = (home: string, ...parts: string[]) => join(home, ...parts);

describe("getXDGStateHome", () => {
  test("returns ~/.local/state by default", () => {
    const result = getXDGStateHome({ homedir: "/home/user" });
    expect(result).toBe(s("/home/user", ".local", "state"));
  });

  test("respects XDG_STATE_HOME env var", () => {
    const result = getXDGStateHome({
      homedir: "/home/user",
      env: { XDG_STATE_HOME: "/custom/state" },
    });
    expect(result).toBe("/custom/state");
  });

  test("uses custom homedir from options", () => {
    const result = getXDGStateHome({ homedir: "/opt/home" });
    expect(result).toBe(s("/opt/home", ".local", "state"));
  });
});

describe("getXDGCacheHome", () => {
  test("returns ~/.cache by default", () => {
    const result = getXDGCacheHome({ homedir: "/home/user" });
    expect(result).toBe(s("/home/user", ".cache"));
  });

  test("respects XDG_CACHE_HOME env var", () => {
    const result = getXDGCacheHome({
      homedir: "/home/user",
      env: { XDG_CACHE_HOME: "/tmp/cache" },
    });
    expect(result).toBe("/tmp/cache");
  });
});

describe("getXDGDataHome", () => {
  test("returns ~/.local/share by default", () => {
    const result = getXDGDataHome({ homedir: "/home/user" });
    expect(result).toBe(s("/home/user", ".local", "share"));
  });

  test("respects XDG_DATA_HOME env var", () => {
    const result = getXDGDataHome({
      homedir: "/home/user",
      env: { XDG_DATA_HOME: "/custom/data" },
    });
    expect(result).toBe("/custom/data");
  });
});

describe("getUserBinDir", () => {
  test("returns ~/.local/bin", () => {
    const result = getUserBinDir({ homedir: "/home/user" });
    expect(result).toBe(s("/home/user", ".local", "bin"));
  });

  test("uses custom homedir from options", () => {
    const result = getUserBinDir({ homedir: "/opt/me" });
    expect(result).toBe(s("/opt/me", ".local", "bin"));
  });
});

describe("path construction", () => {
  test("all paths end with correct subdirectory", () => {
    const home = "/home/test";
    const sep = (process.platform === 'win32') ? '\\\\' : '/';
    expect(getXDGStateHome({ homedir: home })).toMatch(new RegExp(`\\.local${sep}state$`));
    expect(getXDGCacheHome({ homedir: home })).toMatch(new RegExp(`\\.cache$`));
    expect(getXDGDataHome({ homedir: home })).toMatch(new RegExp(`\\.local${sep}share$`));
    expect(getUserBinDir({ homedir: home })).toMatch(new RegExp(`\\.local${sep}bin$`));
  });

  test("respects HOME via homedir override", () => {
    const result = getXDGStateHome({ homedir: "/Users/me" });
    expect(result).toBe(s("/Users/me", ".local", "state"));
  });
});
