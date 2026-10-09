import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallbackAdNetwork } from '../../../src/platform/ads/CallbackAdNetwork';
import { MraidAdNetwork } from '../../../src/platform/ads/MraidAdNetwork';
import { NoopAdNetwork } from '../../../src/platform/ads/NoopAdNetwork';
import { selectAdNetwork } from '../../../src/platform/ads/selectAdNetwork';

type Listener = (value?: boolean) => void;

function fakeMraid(state: string, isViewable: boolean) {
  const listeners = new Map<string, Listener[]>();

  return {
    opened: [] as string[],
    getState: () => state,
    isViewable: () => isViewable,
    addEventListener: (event: string, listener: Listener) => listeners.set(event, [...(listeners.get(event) ?? []), listener]),
    open(url: string) {
      this.opened.push(url);
    },
    emit: (event: string, value?: boolean) => (listeners.get(event) ?? []).forEach((listener) => listener(value)),
  };
}

function stubBrowser(globals: Record<string, unknown>): void {
  vi.stubGlobal('window', { open: vi.fn(), ...globals });
  vi.stubGlobal('navigator', { userAgent: 'Android', maxTouchPoints: 5 });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('selectAdNetwork', () => {
  it('picksTheAdapterByBuildMode', () => {
    stubBrowser({});

    expect(selectAdNetwork('mraid')).toBeInstanceOf(MraidAdNetwork);
    expect(selectAdNetwork('google')).toBeInstanceOf(CallbackAdNetwork);
    expect(selectAdNetwork('meta')).toBeInstanceOf(CallbackAdNetwork);
    expect(selectAdNetwork('mintegral')).toBeInstanceOf(CallbackAdNetwork);
    expect(selectAdNetwork('development')).toBeInstanceOf(NoopAdNetwork);
  });
});

describe('MraidAdNetwork', () => {
  it('waitsForReadyAndVisibilityBeforeStarting', async () => {
    const mraid = fakeMraid('loading', false);
    stubBrowser({ mraid });
    let isStarted = false;
    const started = new MraidAdNetwork().start().then(() => (isStarted = true));

    await Promise.resolve();
    expect(isStarted).toBe(false);
    mraid.emit('ready');
    await Promise.resolve();
    expect(isStarted).toBe(false);
    mraid.emit('viewableChange', true);
    await started;
    expect(isStarted).toBe(true);
  });

  it('opensTheStoreThroughMraidAndReportsPauses', () => {
    const mraid = fakeMraid('default', true);
    stubBrowser({ mraid });
    vi.stubEnv('VITE_STORE_URL_ANDROID', 'https://play.example/app');
    const network = new MraidAdNetwork();
    const pauses: boolean[] = [];

    network.onPauseChange((isPaused) => pauses.push(isPaused));
    mraid.emit('viewableChange', false);
    mraid.emit('viewableChange', true);
    network.openStore();

    expect(pauses).toEqual([true, false]);
    expect(mraid.opened).toEqual(['https://play.example/app']);
  });

  it('doesNotOpenAnEmptyStoreUrl', () => {
    const mraid = fakeMraid('default', true);
    stubBrowser({ mraid });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    new MraidAdNetwork().openStore();

    expect(mraid.opened).toEqual([]);
  });

  it('startsWithoutTheContainerWhenMraidIsMissing', async () => {
    stubBrowser({});
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(new MraidAdNetwork().start()).resolves.toBeUndefined();
  });
});

describe('CallbackAdNetwork', () => {
  it('googleExitsThroughExitApi', () => {
    const exit = vi.fn();
    stubBrowser({ ExitApi: { exit } });

    CallbackAdNetwork.google().openStore();

    expect(exit).toHaveBeenCalledOnce();
  });

  it('mintegralSignalsReadyInstallAndEnd', async () => {
    const calls: string[] = [];
    stubBrowser({ gameReady: () => calls.push('ready'), install: () => calls.push('install'), gameEnd: () => calls.push('end') });
    const network = CallbackAdNetwork.mintegral();

    await network.start();
    network.openStore();
    network.notifyEnded();

    expect(calls).toEqual(['ready', 'install', 'end']);
  });

  it('warnsInsteadOfFailingWhenTheSdkIsMissing', () => {
    stubBrowser({});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    CallbackAdNetwork.meta().openStore();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('FbPlayableAd.onCTAClick'));
  });
});

describe('NoopAdNetwork', () => {
  it('startsAtOnceAndWarnsWithoutAStoreUrl', async () => {
    stubBrowser({});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const network = new NoopAdNetwork();

    await expect(network.start()).resolves.toBeUndefined();
    network.openStore();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No store URL'));
  });
});
