const systemModuleCache = new Map();

export function getSystemModulePath(relativePath) {
    const systemId = game.system.id;
    return foundry.utils.getRoute(`systems/${systemId}/${relativePath}`);
}

export async function importSystemModule(relativePath) {
    const modulePath = getSystemModulePath(relativePath);
    if (!systemModuleCache.has(modulePath)) {
        systemModuleCache.set(modulePath, import(modulePath));
    }

    return systemModuleCache.get(modulePath);
}
