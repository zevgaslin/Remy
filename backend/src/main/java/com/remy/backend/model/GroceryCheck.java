package com.remy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** One grocery list item a user has checked off, keyed by its canonical ingredient name. */
@Entity
@Table(name = "grocery_list_checks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "item_key"}))
public class GroceryCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "item_key", nullable = false)
    private String itemKey;

    protected GroceryCheck() {
    }

    public GroceryCheck(User user, String itemKey) {
        this.user = user;
        this.itemKey = itemKey;
    }

    public String getItemKey() {
        return itemKey;
    }
}
