import assert from "node:assert/strict";
import test from "node:test";
import {
  completedTasks,
  isConfidentialityConclusion,
  isMissingPerson,
  isTimeCode,
  minutesAreRestored,
  normalizeAnswer,
} from "./level1";

test("herkent Marcel en Sophie samen als ontbrekende aanwezigen", () => {
  assert.equal(isMissingPerson("Marcel de Vries en Sophie van Rijn"), true);
  assert.equal(isMissingPerson("sophie van rijn, marcel de vries"), true);
  assert.equal(isMissingPerson("SOPHIE VAN RIJN EN MARCEL DE VRIES"), true);
  assert.equal(isMissingPerson("Sophie van Rijn"), false);
  assert.equal(isMissingPerson("Marcel de Vries"), false);
  assert.equal(isMissingPerson("Erik Meijer"), false);
  assert.equal(isMissingPerson("Erik Meijer en Sophie van Rijn"), false);
});

test("accepteert dezelfde vertrouwelijkheidsafspraak in andere woorden", () => {
  assert.equal(
    isConfidentialityConclusion(
      "De informatie mag alleen door bestuursleden worden ingezien en mag niet worden verspreid voordat er officieel een besluit is genomen.",
    ),
    true,
  );
  assert.equal(
    isConfidentialityConclusion("Alleen bestuursleden mogen dit lezen. Verspreiding is niet toegestaan vóór de officiële besluitvorming."),
    true,
  );
  assert.equal(
    isConfidentialityConclusion(
      "De informatie is uitsluitend bestemd voor bestuursleden van ADO Den Haag. Verspreiding vóór officiële besluitvorming is niet toegestaan.",
    ),
    true,
  );
  assert.equal(
    isConfidentialityConclusion(
      "Vertrouwelijke informatie mag niet gedeeld worden voordat het bestuur officieel een besluit heeft genomen.",
    ),
    true,
  );
  assert.equal(isConfidentialityConclusion("Verspreiding was niet toegestaan vóór de officiële besluitvorming."), false);
  assert.equal(isConfidentialityConclusion("Alleen bestuursleden mogen de informatie inzien."), false);
  assert.equal(isConfidentialityConclusion("persconferentie"), false);
  assert.equal(isConfidentialityConclusion("het was geheim"), false);
});

test("de tijdcode is 2024 en de notulen hebben één juiste volgorde", () => {
  assert.equal(normalizeAnswer("20:24 uur"), "20 24 uur");
  assert.equal(isTimeCode("2024"), true);
  assert.equal(isTimeCode("20:24"), true);
  assert.equal(isTimeCode("2030"), false);
  assert.equal(minutesAreRestored({ "gat-1": "bestuursleden", "gat-2": "verspreiding", "gat-3": "besluitvorming" }), true);
  assert.equal(minutesAreRestored({ "gat-1": "verspreiding", "gat-2": "bestuursleden", "gat-3": "besluitvorming" }), false);
  assert.equal(minutesAreRestored({ "gat-1": "bestuursleden", "gat-2": "persconferentie", "gat-3": "besluitvorming" }), false);
  assert.equal(minutesAreRestored({ "gat-1": "bestuursleden", "gat-2": "besluitvorming", "gat-3": "verspreiding" }), false);
});

test("telt alleen afgeronde opdrachten en sluit dossier 1 pas na de derde", () => {
  assert.equal(completedTasks("intro", 0), 0);
  assert.equal(completedTasks("playing", 0), 0);
  assert.equal(completedTasks("playing", 1), 1);
  assert.equal(completedTasks("playing", 2), 2);
  assert.equal(completedTasks("done", 2), 3);
});
