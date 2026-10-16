package com.remy.backend.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.remy.backend.model.Recipe;
import com.remy.backend.repository.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipeManagementService {
    private final RecipeRepository recipes;
    private final RecipeReadRepository reads;
    private final RecipePreferenceRepository preferences;
    public RecipeManagementService(RecipeRepository recipes, RecipePreferenceRepository preferences, RecipeReadRepository reads) {
        this.recipes=recipes; this.preferences=preferences; this.reads=reads;
    }
    @Transactional(readOnly=true)
    public List<Recipe> list() { return reads.list(); }
    @Transactional(readOnly=true)
    public Recipe get(Long id) {
        return reads.findInOrder(List.of(id)).stream().findFirst()
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Recipe not found."));
    }
    private Recipe getForUpdate(Long id) {
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
        Recipe recipe=getForUpdate(id);
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
        Recipe recipe=getForUpdate(id);
        preferences.deleteForRecipe(id);
        recipes.delete(recipe);
    }
}
