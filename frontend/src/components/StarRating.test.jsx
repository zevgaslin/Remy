// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StarRating from './StarRating';

afterEach(cleanup);

describe('StarRating', () => {
  it('shows the user rating and the average across everyone', () => {
    render(<StarRating value={4} average={3.666} count={3} onRate={() => {}} />);
    expect(screen.getByRole('group', { name: 'Your rating: 4 of 5 stars' })).toBeInTheDocument();
    expect(screen.getByText('3.7 (3 ratings)')).toBeInTheDocument();
    const stars = screen.getAllByRole('button');
    expect(stars.filter((star) => star.classList.contains('filled'))).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Clear your 4-star rating' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports the chosen star count', () => {
    const onRate = vi.fn();
    render(<StarRating onRate={onRate} />);
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rate 2 stars' }));
    expect(onRate).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Rate 1 star' }));
    expect(onRate).toHaveBeenLastCalledWith(1);
  });

  it('previews the rating on hover', () => {
    render(<StarRating value={1} onRate={() => {}} count={1} average={1} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Rate 3 stars' }));
    expect(screen.getAllByRole('button').filter((star) => star.classList.contains('filled'))).toHaveLength(3);
    fireEvent.mouseLeave(screen.getByRole('group'));
    expect(screen.getAllByRole('button').filter((star) => star.classList.contains('filled'))).toHaveLength(1);
    expect(screen.getByText('1.0 (1 rating)')).toBeInTheDocument();
  });
});
