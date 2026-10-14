import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  describe('최근 프롬프트', () => {
    it('히스토리 항목을 누르면 입력창에 채워진다', async () => {
      const user = userEvent.setup();
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} history={['이전 프롬프트 A']} />);

      await user.click(screen.getByRole('button', { name: '이전 프롬프트 A' }));

      expect(screen.getByRole('textbox')).toHaveValue('이전 프롬프트 A');
    });
  });

  describe('글자 수 제한 (500자)', () => {
    it('500자 이하이면 입력값으로 생성이 호출된다', async () => {
      const onGenerate = vi.fn();
      const user = userEvent.setup();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
      const text = '가'.repeat(500);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
      await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

      expect(onGenerate).toHaveBeenCalledWith(text);
    });

    it('501자를 입력하면 생성 버튼이 비활성이다', () => {
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '가'.repeat(501) } });

      expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
    });

    it('501자를 입력하면 초과 경고와 현재 글자 수를 보여준다', () => {
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(501) } });

      expect(screen.getByRole('alert')).toHaveTextContent('500자 이내로 입력해주세요.');
      expect(screen.getByText('501 / 500')).toBeInTheDocument();
    });

    it('초과 상태에서 Ctrl+Enter로 제출해도 생성이 호출되지 않는다', () => {
      const onGenerate = vi.fn();
      render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('초과 경고는 500자 이하에서는 보이지 않는다', () => {
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(500) } });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });
});
