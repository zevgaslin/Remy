package com.remy.backend.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.remy.backend.model.Recipe;
import com.remy.backend.repository.*;
import java.util.*;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipeManagementService {
    private final RecipeRepository recipes;
    private final RecipePreferenceRepository preferences;
    public RecipeManagementService(RecipeRepository recipes, RecipePreferenceRepository preferences) {
        this.recipes=recipes; this.preferences=preferences;
    }
    @Transactional(readOnly=true)
    public List<Recipe> list() { return recipes.findAll(Sort.by(Sort.Direction.DESC,"id")); }
    @Transactional(readOnly=true)
    public Recipe get(Long id) {
        return recipes.findByIdIn(List.of(id)).stream().findFirst()
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Recipe not found."));
    }
    @Transactional
    public Recipe create(String name,String instructions) {
        Recipe recipe=new Recipe(); recipe.setName(name.trim()); recipe.setInstructions(instructions.trim());
        return recipes.save(recipe);
    }
    @Transactional
    public Recipe update(Long id,String name,String instructions) {
        Recipe recipe=get(id);
        recipe.setName(name.trim()); recipe.setInstructions(instructions.trim());
        if (recipe.getDocument() instanceof ObjectNode existing) {
            // API edits must not leave the structured document displaying stale content.
            ObjectNode document=existing.deepCopy(); document.put("name",name.trim());
            if (!Objects.equals(existingInstructions(existing),instructions.trim())) {
                var steps=document.putArray("instructions");
                for (String text:instructions.trim().split("\\n\\s*\\n")) {
                    var step=steps.addObject(); step.put("text",text.trim().replaceFirst("^\\d+\\.\\s*", "")); step.putNull("section");
                }
            }
            recipe.setDocument(document);
        }
        return recipes.save(recipe);
    }
    private String existingInstructions(ObjectNode document) {
        var lines=new ArrayList<String>();
        for (var step:document.get("instructions")) lines.add((lines.size()+1)+". "+step.get("text").asText());
        return String.join("\n\n",lines);
    }
    @Transactional
    public void delete(Long id) {
        Recipe recipe=get(id);
        preferences.deleteForRecipe(id);
        recipes.delete(recipe);
    }
}
