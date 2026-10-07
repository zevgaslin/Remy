package com.remy.backend.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.remy.backend.model.User;
import com.remy.backend.model.UserPreference;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class UserTest {

    private User user;
    private UserPreference allergyPreference;

    @BeforeEach
    public void setUp() {
        user = new User();
        user.setUsername("remy_chef");
        
        allergyPreference = new UserPreference();
        allergyPreference.setPreferenceName("ALLERGY");
        allergyPreference.setPreferenceValue("Peanuts");
    }

    @Test
    public void testAddPreference() {
        // Act
        user.addPreference(allergyPreference);

        // Assert
        assertTrue(user.getPreferences().contains(allergyPreference), "User's preference list should contain the added allergy.");
        assertEquals(user, allergyPreference.getUser(), "The UserPreference should have its User field set back to the parent User.");
    }

    @Test
    public void testRemovePreference() {
        // Arrange
        user.addPreference(allergyPreference);

        // Act
        user.removePreference(allergyPreference);

        // Assert
        assertFalse(user.getPreferences().contains(allergyPreference), "User's preference list should no longer contain the removed allergy.");
        assertNull(allergyPreference.getUser(), "The UserPreference should have its User field set to null after removal.");
    }

    @Test
    public void testSetPreferences() {
        // Arrange
        UserPreference likePreference = new UserPreference();
        likePreference.setPreferenceName("LIKE");
        likePreference.setPreferenceValue("Spicy Food");

        List<UserPreference> newPreferences = new ArrayList<>();
        newPreferences.add(allergyPreference);
        newPreferences.add(likePreference);

        // Act
        user.setPreferences(newPreferences);

        // Assert
        assertEquals(2, user.getPreferences().size(), "User should have exactly 2 preferences.");
        assertTrue(user.getPreferences().contains(allergyPreference));
        assertTrue(user.getPreferences().contains(likePreference));
    }
}