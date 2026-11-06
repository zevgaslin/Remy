import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KitchenPage from './kitchenPage';
import { getCalendar } from '../services/calendarServices';
import { useAuth } from '../context/useAuth';
vi.mock('../services/calendarServices', () => ({ getCalendar: vi.fn() }));
vi.mock('../context/useAuth', () => ({ useAuth: vi.fn() }));
const keyFor = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const recipe = name => ({ name, document: { ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup' }], instructions: [{ text: `Cook ${name} until tender.` }] } });
const renderPage = () => render(<MemoryRouter><KitchenPage /></MemoryRouter>);
describe('Kitchen day view', () => {
  beforeEach(() => { vi.clearAllMocks(); useAuth.mockReturnValue({ currentUser: { id: 1, token: 'token' } }); });
  it('shows only the chosen day, includes custom slots and keeps meal sections independent', async () => {
    const today = keyFor(new Date());
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    getCalendar.mockResolvedValue({ dailyMealSlots: { [today]: [{ id:'breakfast',label:'Breakfast',time:'08:00' },{ id:'tea',label:'Afternoon tea',time:'16:00' }] }, plannedMeals: {
      [`${today}::breakfast`]: recipe('Morning rice'), [`${today}-tea`]: recipe('Tea cakes'),
      [`${keyFor(tomorrow)}::lunch`]: recipe('Tomorrow soup'),
    } });
    renderPage();
    expect(await screen.findByText('Morning rice')).toBeInTheDocument();
    expect(screen.getByText('Afternoon tea · 16:00')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name:'Instructions' })).toHaveLength(2);
    expect(screen.queryByText('Tomorrow soup')).not.toBeInTheDocument();
    const breakfast=screen.getByText('Morning rice').closest('details');
    const tea=screen.getByText('Tea cakes').closest('details');
    fireEvent.click(breakfast.querySelector('summary'));
    expect(breakfast).not.toHaveAttribute('open');expect(tea).toHaveAttribute('open');
    fireEvent.click(screen.getByRole('button',{name:'Next day'}));
    expect(screen.getByText('Tomorrow soup')).toBeInTheDocument();expect(screen.queryByText('Morning rice')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Previous day'}));
    expect(screen.getByText('Morning rice')).toBeInTheDocument();
    expect(getCalendar).toHaveBeenCalledTimes(1);
  });
  it('shows an empty day and retries a failed calendar load', async () => {
    getCalendar.mockRejectedValueOnce(new Error('Calendar unavailable')).mockResolvedValue({plannedMeals:{},dailyMealSlots:{}});
    renderPage();expect(await screen.findByRole('alert')).toHaveTextContent('Calendar unavailable');
    fireEvent.click(screen.getByRole('button',{name:'Retry'}));
    expect(await screen.findByText('No recipes planned for this day')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Meal Planner'})).toHaveAttribute('href','/');
  });
  it('ignores an old account request after switching accounts', async () => {
    let resolveOld;
    getCalendar.mockImplementationOnce(() => new Promise(resolve => { resolveOld=resolve; })).mockResolvedValue({plannedMeals:{},dailyMealSlots:{}});
    const view=renderPage();
    useAuth.mockReturnValue({currentUser:{id:2,token:'new-token'}});view.rerender(<MemoryRouter><KitchenPage /></MemoryRouter>);
    expect(await screen.findByText('No recipes planned for this day')).toBeInTheDocument();
    await act(async () => resolveOld({plannedMeals:{[`${keyFor(new Date())}::breakfast`]:recipe('Private old meal')},dailyMealSlots:{}}));
    await waitFor(() => expect(screen.queryByText('Private old meal')).not.toBeInTheDocument());
  });
});
