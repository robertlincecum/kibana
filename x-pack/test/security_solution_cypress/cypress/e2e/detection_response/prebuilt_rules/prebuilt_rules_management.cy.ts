/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { tag } from '../../../tags';

import { createRuleAssetSavedObject } from '../../../helpers/rules';
import {
  COLLAPSED_ACTION_BTN,
  ELASTIC_RULES_BTN,
  ADD_ELASTIC_RULES_BTN,
  RULES_EMPTY_PROMPT,
  RULES_MONITORING_TAB,
  RULES_ROW,
  RULES_MANAGEMENT_TABLE,
  RULE_SWITCH,
  SELECT_ALL_RULES_ON_PAGE_CHECKBOX,
  INSTALL_ALL_RULES_BUTTON,
} from '../../../screens/alerts_detection_rules';
import {
  deleteFirstRule,
  selectAllRules,
  selectNumberOfRules,
  waitForPrebuiltDetectionRulesToBeLoaded,
  waitForRuleToUpdate,
} from '../../../tasks/alerts_detection_rules';
import {
  deleteSelectedRules,
  disableSelectedRules,
  enableSelectedRules,
} from '../../../tasks/rules_bulk_actions';
import {
  createAndInstallMockedPrebuiltRules,
  getAvailablePrebuiltRulesCount,
} from '../../../tasks/api_calls/prebuilt_rules';
import {
  cleanKibana,
  deleteAlertsAndRules,
  deletePrebuiltRulesAssets,
} from '../../../tasks/common';
import { login, visitWithoutDateRange } from '../../../tasks/login';
import { DETECTIONS_RULE_MANAGEMENT_URL } from '../../../urls/navigation';

const rules = Array.from(Array(5)).map((_, i) => {
  return createRuleAssetSavedObject({
    name: `Test rule ${i + 1}`,
    rule_id: `rule_${i + 1}`,
  });
});

describe('Prebuilt rules', { tags: [tag.ESS, tag.SERVERLESS] }, () => {
  before(() => {
    cleanKibana();
  });

  beforeEach(() => {
    login();
    deleteAlertsAndRules();
    deletePrebuiltRulesAssets();
    visitWithoutDateRange(DETECTIONS_RULE_MANAGEMENT_URL);
    createAndInstallMockedPrebuiltRules({ rules });
    cy.reload();
    waitForPrebuiltDetectionRulesToBeLoaded();
  });

  describe('Alerts rules, prebuilt rules', () => {
    it('Loads prebuilt rules', () => {
      // Check that the rules table contains rules
      cy.get(RULES_MANAGEMENT_TABLE).find(RULES_ROW).should('have.length.gte', 1);

      // Check the correct count of prebuilt rules is displayed
      getAvailablePrebuiltRulesCount().then((availablePrebuiltRulesCount) => {
        cy.get(ELASTIC_RULES_BTN).should(
          'have.text',
          `Elastic rules (${availablePrebuiltRulesCount})`
        );
      });
    });

    context('Rule monitoring table', () => {
      it('Allows to enable/disable all rules at once', () => {
        cy.get(RULES_MONITORING_TAB).click();

        cy.get(SELECT_ALL_RULES_ON_PAGE_CHECKBOX).click();
        enableSelectedRules();
        waitForRuleToUpdate();
        cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'true');

        selectAllRules();
        disableSelectedRules();
        waitForRuleToUpdate();
        cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'false');
      });
    });
  });

  describe('Actions with prebuilt rules', () => {
    context('Rules table', () => {
      it('Allows to enable/disable all rules at once', () => {
        selectAllRules();
        enableSelectedRules();
        waitForRuleToUpdate();
        cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'true');

        disableSelectedRules();
        waitForRuleToUpdate();
        cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'false');
      });

      it('Does not allow to delete one rule when more than one is selected', () => {
        const numberOfRulesToBeSelected = 2;
        selectNumberOfRules(numberOfRulesToBeSelected);

        cy.get(COLLAPSED_ACTION_BTN).each((collapsedItemActionBtn) => {
          cy.wrap(collapsedItemActionBtn).should('have.attr', 'disabled');
        });
      });

      it('Deletes and recovers one rule', () => {
        getAvailablePrebuiltRulesCount().then((availablePrebuiltRulesCount) => {
          const expectedNumberOfRulesAfterDeletion = availablePrebuiltRulesCount - 1;
          const expectedNumberOfRulesAfterRecovering = availablePrebuiltRulesCount;

          deleteFirstRule();

          cy.get(ELASTIC_RULES_BTN).should(
            'have.text',
            `Elastic rules (${expectedNumberOfRulesAfterDeletion})`
          );
          cy.get(ADD_ELASTIC_RULES_BTN).should('have.text', `Add Elastic rules1`);

          // Navigate to the prebuilt rule installation page
          cy.get(ADD_ELASTIC_RULES_BTN).click();

          // Click the "Install all rules" button
          cy.get(INSTALL_ALL_RULES_BUTTON).click();

          // Wait for the rules to be installed
          cy.get(INSTALL_ALL_RULES_BUTTON).should('be.disabled');

          // Navigate back to the rules page
          cy.go('back');

          cy.get(ELASTIC_RULES_BTN).should(
            'have.text',
            `Elastic rules (${expectedNumberOfRulesAfterRecovering})`
          );
        });
      });

      it('Deletes and recovers more than one rule', () => {
        getAvailablePrebuiltRulesCount().then((availablePrebuiltRulesCount) => {
          const numberOfRulesToBeSelected = 2;
          const expectedNumberOfRulesAfterDeletion = availablePrebuiltRulesCount - 2;
          const expectedNumberOfRulesAfterRecovering = availablePrebuiltRulesCount;

          selectNumberOfRules(numberOfRulesToBeSelected);
          deleteSelectedRules();

          cy.get(ADD_ELASTIC_RULES_BTN).should(
            'have.text',
            `Add Elastic rules${numberOfRulesToBeSelected}`
          );
          cy.get(ELASTIC_RULES_BTN).should(
            'have.text',
            `Elastic rules (${expectedNumberOfRulesAfterDeletion})`
          );

          // Navigate to the prebuilt rule installation page
          cy.get(ADD_ELASTIC_RULES_BTN).click();

          // Click the "Install all rules" button
          cy.get(INSTALL_ALL_RULES_BUTTON).click();

          // Wait for the rules to be installed
          cy.get(INSTALL_ALL_RULES_BUTTON).should('be.disabled');

          // Navigate back to the rules page
          cy.go('back');

          // Check that the rules table contains all rules
          cy.get(ELASTIC_RULES_BTN).should(
            'have.text',
            `Elastic rules (${expectedNumberOfRulesAfterRecovering})`
          );
        });
      });

      it('Allows to delete all rules at once', () => {
        selectAllRules();
        deleteSelectedRules();
        cy.get(RULES_EMPTY_PROMPT).should('be.visible');
      });
    });
  });
});
