import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const COMPONENT_CODE = 'const Card = () => <div>카드</div>;\nrender(<Card />);';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/config') {
        return jsonResponse({ envKeys: { anthropic: false, google: false } });
      }
      return jsonResponse({ code: COMPONENT_CODE });
    }),
  );
}

/** 새로고침을 흉내 낸다: 화면을 내리고 같은 localStorage로 다시 그린다. */
function reload() {
  const { unmount } = render(<App />);
  unmount();
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
  mockFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App 상태 유지 (localStorage)', () => {
  it('API 키는 새로고침 후에도 남아 있다', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText('API Key'), 'AIza-test-key');
    unmount();

    render(<App />);

    expect(screen.getByLabelText('API Key')).toHaveValue('AIza-test-key');
  });

  it('선택한 Provider는 새로고침 후에도 남아 있다', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    unmount();

    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
  });

  it('Provider를 바꿔도 각 Provider의 API 키가 따로 유지된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('API Key'), 'AIza-google');

    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('');
    await user.type(screen.getByLabelText('API Key'), 'sk-ant-x');

    await user.selectOptions(screen.getByLabelText('Provider'), 'google');
    expect(screen.getByLabelText('API Key')).toHaveValue('AIza-google');
  });

  it('생성된 컴포넌트 목록은 새로고침 후에도 남아 있다', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText('API Key'), 'AIza-test-key');
    await user.type(screen.getByRole('textbox'), '카드 컴포넌트');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByRole('heading', { name: '생성된 컴포넌트' });
    unmount();

    render(<App />);

    expect(screen.getByRole('heading', { name: '생성된 컴포넌트' })).toBeInTheDocument();
  });

  it('프롬프트 히스토리는 새로고침 후에도 남아 있다', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText('API Key'), 'AIza-test-key');
    await user.type(screen.getByRole('textbox'), '카드 컴포넌트');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByRole('heading', { name: '생성된 컴포넌트' });
    unmount();

    render(<App />);

    expect(screen.getByRole('button', { name: '카드 컴포넌트' })).toBeInTheDocument();
  });

  it('저장된 값이 깨져 있어도 앱이 기본 상태로 뜬다', () => {
    localStorage.setItem('rcg.provider', '{broken');
    localStorage.setItem('rcg.components', 'not json');

    reload();

    expect(screen.getByLabelText('Provider')).toHaveValue('google');
    expect(screen.queryByRole('heading', { name: '생성된 컴포넌트' })).not.toBeInTheDocument();
  });
});
