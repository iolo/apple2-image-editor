const getInvoke = () => window.__TAURI__?.core?.invoke ?? null;

export const isTauri = () => getInvoke() !== null;

export const openNativeFile = async () => {
  const opened = await getInvoke()('open_file');
  if (!opened) return null;
  return new File([new Uint8Array(opened.data)], opened.name);
};

export const chooseNativeSavePath = (defaultName) =>
  getInvoke()('choose_save_path', { defaultName });

export const writeNativeFile = (path, data) =>
  getInvoke()('write_file', { path, data: Array.from(data) });
