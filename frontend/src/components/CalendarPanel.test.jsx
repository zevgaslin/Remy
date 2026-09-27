import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getDailyNutritionTotal, DailyNutritionSummary } from './CalendarPanel';

describe('getDailyNutritionTotal', () => {
  
  it('returns combined nutrition totals for all planned meal slots on a specific date', () => {
    // Arrange
    const fixedDate = new Date('2026-10-15T12:00:00Z'); // dateKey: '2026-10-15'
    const mealSlots = [{ id: 'breakfast' }, { id: 'dinner' }];
    const mockMeals = {
      '2026-10-15-breakfast': { nutrition: { calories: 300, protein: 10, carbs: 40, fat: 10 } },
      '2026-10-15-dinner': { nutrition: { calories: 600, protein: 30, carbs: 50, fat: 20 } },
      // This meal is on a different day and should be ignored
      '2026-10-16-breakfast': { nutrition: { calories: 500, protein: 20, carbs: 50, fat: 15 } } 
    };

    // Act
    const result = getDailyNutritionTotal(fixedDate, mockMeals, mealSlots);

    // Assert
    expect(result).toEqual({ calories: 900, protein: 40, carbs: 90, fat: 30 });
  });

  it('returns zeroes when there are no meals planned for the date', () => {
    // Arrange
    const fixedDate = new Date('2026-10-15T12:00:00Z');
    const mealSlots = [{ id: 'breakfast' }, { id: 'lunch' }];
    const mockMeals = {}; // Empty schedule

    // Act
    const result = getDailyNutritionTotal(fixedDate, mockMeals, mealSlots);

    // Assert
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('handles meals that are missing nutrition data gracefully without returning NaN', () => {
    // Arrange
    const fixedDate = new Date('2026-10-15T12:00:00Z');
    const mealSlots = [{ id: 'snack' }];
    const mockMeals = {
      '2026-10-15-snack': { name: 'Apple' } // No nutrition object attached
    };

    // Act
    const result = getDailyNutritionTotal(fixedDate, mockMeals, mealSlots);

    // Assert
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('DailyNutritionSummary Component', () => {

  it('renders accurate daily totals and calculates percentage of daily value', () => {
    // Arrange
    const mockTotals = { calories: 1000, protein: 25, carbs: 137.5, fat: 39 };

    // Act
    render(<DailyNutritionSummary totals={mockTotals} />);

    // Assert
    // Based on DAILY_TARGETS: Cal: 2000, Pro: 50g, Carb: 275g, Fat: 78g
    // The provided totals are exactly 50% of the daily targets.
    expect(screen.getByText('Cal: 1000')).toBeInTheDocument();
    expect(screen.getByText('Pro: 25g')).toBeInTheDocument();
    expect(screen.getByText('Carb: 137.5g')).toBeInTheDocument();
    expect(screen.getByText('Fat: 39g')).toBeInTheDocument();
    
    // Verify percentages are calculated correctly (50%)
    const percentageElements = screen.getAllByText('50% DV');
    expect(percentageElements).toHaveLength(4);
  });

  it('caps the daily value percentage at 100% when targets are exceeded', () => {
    // Arrange
    const massiveTotals = { calories: 5000, protein: 200, carbs: 500, fat: 150 };

    // Act
    render(<DailyNutritionSummary totals={massiveTotals} />);

    // Assert
    // Even though 5000 calories is 250% of 2000, the UI should cap at 100%
    const cappedPercentageElements = screen.getAllByText('100% DV');
    expect(cappedPercentageElements).toHaveLength(4);
  });
});