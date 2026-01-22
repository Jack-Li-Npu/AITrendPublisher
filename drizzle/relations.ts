import { relations } from "drizzle-orm/relations";
import { templates, templateCategories, templateVersions } from "./schema";

export const templateCategoriesRelations = relations(templateCategories, ({one}) => ({
	template: one(templates, {
		fields: [templateCategories.templateId],
		references: [templates.id]
	}),
}));

export const templatesRelations = relations(templates, ({many}) => ({
	templateCategories: many(templateCategories),
	templateVersions: many(templateVersions),
}));

export const templateVersionsRelations = relations(templateVersions, ({one}) => ({
	template: one(templates, {
		fields: [templateVersions.templateId],
		references: [templates.id]
	}),
}));