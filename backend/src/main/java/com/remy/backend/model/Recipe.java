package com.remy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;

@Entity
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Lob
    private String instructions;

    @Column(nullable = false)
    private int likes = 0;

    @Column(nullable = false)
    private int dislikes = 0;

    public Recipe() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public int getLikeCount() {
        return likes;
    }

    public int getDislikes() {
        return dislikes;
    }

    public void setDislikes(int dislikes) {
        this.dislikes = dislikes;
    }

    public int getDislikeCount() {
        return dislikes;
    }

    public void applyPreferenceChange(PreferenceType previous, PreferenceType next) {
        if (previous == PreferenceType.LIKE) {
            likes = Math.max(0, likes - 1);
        } else if (previous == PreferenceType.DISLIKE) {
            dislikes = Math.max(0, dislikes - 1);
        }

        if (next == PreferenceType.LIKE) {
            likes++;
        } else if (next == PreferenceType.DISLIKE) {
            dislikes++;
        }
    }
}
