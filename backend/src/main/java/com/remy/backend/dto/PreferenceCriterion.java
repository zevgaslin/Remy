package com.remy.backend.dto;

public class PreferenceCriterion {

    private String name;
    private String value;

    public PreferenceCriterion() {
    }

    public PreferenceCriterion(String name, String value) {
        this.name = name;
        this.value = value;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
