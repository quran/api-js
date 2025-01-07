/* eslint-disable no-undef */
import path from 'path';
import fs from 'fs';

/*
  Plugin is based on the `esbuild-plugin-umd-wrapper`, found at:
  https://github.com/inqnuam/esbuild-plugin-umd-wrapper
*/

// eslint-disable-next-line no-unused-vars
const createWrapperWithLib = ({
  depsKeys,
  depsValKey,
  amdLoader,
  lib,
  defineDeps,
  globalDeps,
  requireDeps,
}) => {
  return `(function (g, f) {
      if ("object" == typeof exports && "object" == typeof module) {
        module.exports = f(${requireDeps});
      } else if ("function" == typeof ${amdLoader} && ${amdLoader}.amd) {
        ${amdLoader}("${lib}", ${defineDeps}, f);
      } else if ("object" == typeof exports) {
        exports["${lib}"] = f(${requireDeps});
      } else {
        g["${lib}"] = {};
        Object.assign(g["${lib}"], f(${globalDeps}));
      }
    }(this, (${depsKeys}) => {
  var exports = {};
  var module = { exports };\n\n`;
};

export const alphabet = [
  '__da',
  '__db',
  '__dc',
  '__dd',
  '__de',
  '__df',
  '__dg',
  '__dh',
  '__di',
  '__dj',
  '__dk',
  '__dl',
  '__dm',
  '__dn',
  '__do',
  '__dp',
  '__dq',
  '__dr',
  '__ds',
  '__dt',
  '__du',
  '__dv',
  '__dw',
  '__dx',
  '__dy',
  '__dz',
];

function getUmdBanner(opts) {
  const external = opts.external ?? [];
  const defineDeps = external?.length ? `['${external.join("', '")}']` : '[]';
  const globalDeps = external?.map((x) => `g["${x}"]`).join(', ') ?? '';
  const requireDeps = external?.map((x) => `require('${x}')`).join(', ') ?? '';
  let deps = [];
  if (external) {
    deps = external.map((x, i) => {
      return {
        key: alphabet[i],
        val: x,
      };
    });
  }
  const depsKeys = deps.map((x) => x.key).join(', ');
  const depsValKey = deps.map((x) => `"${x.val}": ${x.key}`).join(', ');
  const options = {
    depsKeys,
    depsValKey,
    amdLoader: 'define',
    defineDeps,
    globalDeps,
    requireDeps,
    lib: opts.libraryName,
  };
  const result = createWrapperWithLib(options);
  return result;
}

export const umdFooter = `if (typeof module.exports == "object" && typeof exports == "object") {
    var __cp = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (let key of Object.getOwnPropertyNames(from)) {
          if (!Object.prototype.hasOwnProperty.call(to, key) && key !== except)
          Object.defineProperty(to, key, {
            get: () => from[key],
            enumerable: !(desc = Object.getOwnPropertyDescriptor(from, key)) || desc.enumerable,
          });
        }
      }
      return to;
    };
    module.exports = __cp(module.exports, exports);
  }
  return module.exports;
  }))\n\n\n`;

export const umdWrapperSetup = (build) => {
  const { initialOptions } = build;
  const external = initialOptions.external;
  const content = getUmdBanner(external);
  if (initialOptions.footer) {
    if (initialOptions.footer.js) {
      initialOptions.footer.js += umdFooter;
    } else {
      initialOptions.footer.js = umdFooter;
    }
  } else {
    initialOptions.footer = {
      js: umdFooter,
    };
  }

  if (initialOptions.banner) {
    if (initialOptions.banner.js) {
      initialOptions.banner.js += content;
    } else {
      initialOptions.banner.js = content;
    }
  } else {
    initialOptions.banner = {
      js: content,
    };
  }
};

export const createUmdWrapper = (opts) => {
  let pluginExternalDependencies = [];

  return {
    name: 'add-umd-wrapper',
    esbuildOptions(options) {
      options.format = 'cjs';
      pluginExternalDependencies = [];
      return options;
    },
    buildEnd(result) {
      try {
        result.writtenFiles.forEach((file) => {
          const filePath = path.join(process.cwd(), file.name);
          if (file.name.endsWith('.js')) {
            const fileName = path.basename(file.name);
            const umdBanner = getUmdBanner({
              ...opts,
              external: pluginExternalDependencies,
            });

            const content = fs.readFileSync(filePath, 'utf-8');
            const patchedFileContents = content.replace(
              `//# sourceMappingURL=${fileName}.map`,
              ''
            );
            const scriptContent = `\n\n\n${patchedFileContents}\n\n\n`;
            const wrappedContent = `${umdBanner}${scriptContent}${umdFooter}\n\n//# sourceMappingURL=${fileName}.map\n`;
            const newContent = `/* umd */\n${wrappedContent}`;

            fs.writeFileSync(filePath, newContent, 'utf8');
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    },
  };
};
