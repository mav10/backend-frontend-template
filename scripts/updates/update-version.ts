import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import {
  copyProjectFolder,
  copyProjectFolderDefaultOptions,
  patchFile,
  patchFiles,
  removePackageReference,
  updatePlaywright,
} from './update-helper.ts';
import type * as TemplateJson from '../../.template.json';
import * as Diff from 'diff';
// current version is stored here
const templateJsonFileName = '.template.json';

const patchVersionRegex = '^\\d\\d\\d\\d-\\d\\d-\\d\\d-\\d\\d';
const updateList = [
  { from: '1.3.0', update: updateFrom_1p3_to_1p4 },
  { from: '1.4.0', update: updateFrom_1p4_to_1p5 },
  { from: '1.5.0', update: updateFrom_1p5_to_1p6 },
  { from: '1.6.0', update: updateFrom_1p6_to_1p7 },
];

export function updateVersion(prefix: string) {
  const currentFolder = process.cwd();
  const templateFolder = process.cwd() + '_template';

  const currentFolderJsonFileName = path.join(
    currentFolder,
    templateJsonFileName,
  );
  var currentTemplateSettings: typeof TemplateJson = fs.existsSync(
    currentFolderJsonFileName,
  )
    ? JSON.parse(fs.readFileSync(currentFolderJsonFileName).toString())
    : { version: '1.0.0', lastPatch: '0000-00-00-00' };

  var newTemplateSettings: typeof TemplateJson = JSON.parse(
    fs.readFileSync(path.join(templateFolder, templateJsonFileName)).toString(),
  );

  process.chdir(templateFolder.replace('_template', ''));

  try {
    applyUpdates();
    currentTemplateSettings.version = newTemplateSettings.version;
    saveTemplateJson();

    const lastPatch = applyPatches();
    if (lastPatch) {
      currentTemplateSettings.lastPatch =
        lastPatch.match(patchVersionRegex)![0];
      console.log(`Last applied patch: ${currentTemplateSettings.lastPatch}`);
    }
    saveTemplateJson();
  } finally {
    process.chdir(currentFolder);
  }

  function saveTemplateJson() {
    fs.writeFileSync(
      currentFolderJsonFileName,
      JSON.stringify(currentTemplateSettings),
    );
  }

  function applyUpdates() {
    console.log('Applying manual updates...');
    const currentVersion = currentTemplateSettings.version;
    for (const update of updateList) {
      if (semver.gte(update.from, currentVersion)) {
        console.log(`Applying manual update for version ${update.from}.`);
        update.update(currentFolder, templateFolder, prefix);
      }
    }
    console.log(`Applying manual update for any version.`);
    updateAll(currentFolder, templateFolder, prefix);
    console.log('Applying manual updates finished.');
  }

  /*
   * Returns last applied patch
   */
  function applyPatches(): string | null {
    console.log(`Applying patches...`);
    var patches = getNewPatches();
    for (const patch of patches) {
      console.log(`Applying patch '${patch}'`);

      const patchContents = fs
        .readFileSync(path.join(templateFolder, 'patches', patch))
        .toString();
      Diff.applyPatches(patchContents, {
        loadFile(index, callback) {
          const fullPath = path.join(currentFolder, index.index!);
          if (fs.existsSync(fullPath)) {
            callback(null, fs.readFileSync(fullPath).toString());
          } else {
            callback(null, '');
          }
        },
        patched(index, content, callback) {
          if (!content) {
            const patchIndex = patch.match(patchVersionRegex)![0];
            callback(
              new Error(
                `Error applying patch '${patch}' to file '${index.index}'. Please check it and try to apply manually. To continue (after you manually applied it or decide to skip) set the 'lastPatch' property to '${patchIndex}' in '.template.json'`,
              ),
            );
            return;
          }
          fs.writeFileSync(path.join(currentFolder, index.index!), content);
          callback(null);
        },
        complete() {},
      });
    }
    console.log(`Finished applying patches.`);
    return patches.length > 0 ? patches[patches.length - 1] : null;
  }

  function getNewPatches(): string[] {
    const files = fs.readdirSync(path.join(templateFolder, 'patches'));
    const filteredFiles = files.filter((x) => {
      if (x.match(patchVersionRegex)) return true;
      console.warn(
        `File with name 'patches/${x}' doesn't match the expected pattern.`,
      );
    });
    const sortedFiles = filteredFiles.sort();
    const filesToApply = sortedFiles.filter(
      (x) => x > (currentTemplateSettings.lastPatch ?? ''),
    );
    return filesToApply;
  }
}
function patchPackageJson(regExp: RegExp | string, replacement: string) {
  patchFile('package.json', regExp, replacement);
  patchFile('frontend/package.json', regExp, replacement);
  patchFile('e2e/package.json', regExp, replacement);
}

function updateFrom_1p3_to_1p4(
  currentFolder: string,
  templateFolder: string,
  prefix: string,
) {
  copyProjectFolder(`webapi/src/${prefix}.App/Features/TestApi`);
  copyProjectFolder(`webapi/tests/${prefix}.App.Tests/TestApiServiceTests.cs`);
  copyProjectFolder(`webapi/src/${prefix}.Http/GeneratedClientOverrides.cs`);
  copyProjectFolder(`webapi/src/${prefix}.Domain/BaseEntity.cs`);
  copyProjectFolder(
    `webapi/src/${prefix}.App/Utils`,
    copyProjectFolderDefaultOptions,
  );
}

function updateFrom_1p4_to_1p5(
  currentFolder: string,
  templateFolder: string,
  prefix: string,
) {
  patchPackageJson(/\"nswag\": \".*?\",/, '');
  patchPackageJson(
    'nswag openapi2csclient',
    'react-query-swagger openapi2csclient /nswag',
  );

  // required for openiddict 4
  patchFile(
    'frontend/src/pages/unauthorized/openid/openid-manager.ts',
    'extraTokenParams: { scope: scopes },',
    '',
  );

  patchFile('webapi/Directory.Build.props', '</noWarn>', ';1570;1998</noWarn>');
  updatePlaywright('1.33.0');
}

function updateFrom_1p5_to_1p6(
  currentFolder: string,
  templateFolder: string,
  prefix: string,
) {
  copyProjectFolder(`frontend/src/application/constants/create-link.ts`);

  copyProjectFolder(`frontend/src/components/sign-url/SignUrlImage.tsx`);
  copyProjectFolder(
    `frontend/src/components/sign-url`,
    copyProjectFolderDefaultOptions,
  );
  fs.removeSync(
    path.join(
      currentFolder,
      `frontend/src/components/sign-url/SignUrlImage.partial.tsx`,
    ),
  );
  copyProjectFolder(
    `frontend/src/components/animations`,
    copyProjectFolderDefaultOptions,
  );
  copyProjectFolder(`frontend/src/helpers`, copyProjectFolderDefaultOptions);

  removePackageReference(
    `webapi/src/${prefix}.App/${prefix}.App.csproj`,
    'OpenIddict.AspNetCore',
  );
  removePackageReference(
    `webapi/src/${prefix}.App/${prefix}.App.csproj`,
    'OpenIddict.EntityFrameworkCore',
  );
  removePackageReference(
    `webapi/src/${prefix}.Domain/${prefix}.Domain.csproj`,
    'Newtonsoft.Json',
  );
  removePackageReference(
    `webapi/src/${prefix}.Persistence/${prefix}.Persistence.csproj`,
    'Npgsql.EntityFrameworkCore.PostgreSQL',
  );
  removePackageReference(
    `webapi/src/${prefix}.Persistence/${prefix}.Persistence.csproj`,
    'Npgsql.Json.NET',
  );
  removePackageReference(
    `webapi/src/${prefix}.Persistence/${prefix}.Persistence.csproj`,
    'Audit.NET',
  );
  removePackageReference(
    `webapi/src/${prefix}.Persistence/${prefix}.Persistence.csproj`,
    'Audit.EntityFramework.Core',
  );
  removePackageReference(
    `webapi/src/${prefix}.Persistence/${prefix}.Persistence.csproj`,
    'System.IdentityModel.Tokens.Jwt',
  );

  removePackageReference(
    `webapi/Lib/Testing/MccSoft.Testing/MccSoft.Testing.csproj`,
    'Newtonsoft.Json',
  );
  copyProjectFolder('frontend/src/components/uikit/inputs/dropdown/types.ts');
  copyProjectFolder(
    'frontend/src/components/uikit/inputs/dropdown/StyledAutocomplete.tsx',
  );
  copyProjectFolder(
    'frontend/src/components/uikit/inputs/dropdown/StyledAutocomplete.tsx',
  );
  patchFiles('frontend/src', 'helpers/interceptors/auth', 'helpers/auth');

  fs.moveSync(
    path.join(currentFolder, 'frontend/src/helpers/interceptors/auth'),
    path.join(currentFolder, 'frontend/src/helpers/auth'),
    {
      overwrite: true,
    },
  );

  patchFiles(
    'frontend/src',
    './pages/unauthorized/openid',
    'helpers/auth/openid',
  );
  patchFiles(
    'frontend/src',
    'pages/unauthorized/openid',
    'helpers/auth/openid',
  );
  patchFile(
    'frontend/src/pages/unauthorized/LoginPage.tsx',
    './openid/',
    'helpers/auth/openid/',
  );
  patchFiles('frontend/src', 'helpers/interceptors/auth', 'helpers/auth');
  fs.moveSync(
    path.join(currentFolder, 'frontend/src/pages/unauthorized/openid'),
    path.join(currentFolder, 'frontend/src/helpers/auth/openid'),
    {
      overwrite: true,
    },
  );
  //
}

function updateFrom_1p6_to_1p7(
  currentFolder: string,
  templateFolder: string,
  prefix: string,
) {}

/*
 * This function is run for every `pull-template-changes`.
 * It makes sense to put all modifications here, and once there's a good number of them,
 * create a new version and move them to versioned update.
 */
function updateAll(
  currentFolder: string,
  templateFolder: string,
  prefix: string,
) {
  copyProjectFolder('frontend/src/helpers/router/useBlockNavigation.ts');
  copyProjectFolder('frontend/src/helpers/router/useBlocker.ts');
  fs.removeSync(
    path.join(
      currentFolder,
      'frontend/src/helpers/router/useCallbackPrompt.ts',
    ),
  );

  updatePlaywright('1.52.0');
}
