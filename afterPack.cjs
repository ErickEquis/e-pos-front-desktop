const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

exports.default = async function (context) {
    // Si la plataforma es mac, copiamos los node_modules explícitamente al build ya desempaquetado de producción
    const outDir = context.appOutDir;
    let targetApiDir;

    if (context.packager.platform.name === 'mac') {
        targetApiDir = path.join(outDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources', 'app.asar.unpacked', 'desktop-api');
    } else if (context.packager.platform.name === 'windows') {
        targetApiDir = path.join(outDir, 'resources', 'app.asar.unpacked', 'desktop-api');
    } else {
        targetApiDir = path.join(outDir, 'resources', 'app.asar.unpacked', 'desktop-api');
    }

    if (fs.existsSync(targetApiDir)) {
        console.log(`[AfterPack Hook] Desplegando dependencias nativas en ${targetApiDir}...`);
        try {
            const apiSource = path.join(__dirname, 'desktop-api', 'node_modules');
            if (fs.existsSync(apiSource)) {
                execSync(`cp -R "${apiSource}" "${targetApiDir}/"`);

                // Remover symlink cíclico de NPM Workspace/Self-Link
                const cyclicLink = path.join(targetApiDir, 'node_modules', 'punto-venta');
                if (fs.existsSync(cyclicLink)) {
                    fs.rmSync(cyclicLink, { recursive: true, force: true });
                }

                console.log(`[AfterPack Hook] Node_modules copiados exitosamente a asar.unpacked/desktop-api.`);
            } else {
                console.warn(`[AfterPack Hook] El origen de dependencias ${apiSource} no existe.`);
            }
        } catch (e) {
            console.error(`[AfterPack Hook] Error copiando dependencias:`, e);
        }
    } else {
        console.warn(`[AfterPack Hook] Directorio de API Final no encontrado en ${targetApiDir}.`);
    }
};
