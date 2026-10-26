import assert from "node:assert/strict";
import test from "node:test";
import {
  dossier1Complete,
  dossier2Complete,
  dossier2DoneCount,
  folderIsConfidential,
  isHiddenConclusion,
  personIsTechnical,
  rolesMatch,
  stripsAreConfidential,
} from "./level2";

test("map B is het vertrouwelijke stadiondossier", () => {
  assert.equal(folderIsConfidential("b"), true);
  assert.equal(folderIsConfidential("a"), false);
  assert.equal(folderIsConfidential("c"), false);
});

test("koppelt elke persoon aan de eigen functie en wijst techniek aan Tom", () => {
  assert.equal(
    rolesMatch({ bestuur: "marcel", financien: "karin", techniek: "tom", communicatie: "sophie" }),
    true,
  );
  assert.equal(
    rolesMatch({ bestuur: "tom", financien: "karin", techniek: "marcel", communicatie: "sophie" }),
    false,
  );
  assert.equal(personIsTechnical("tom"), true);
  assert.equal(personIsTechnical("sophie"), false);
});

test("de niet-openbare stroken zijn financiën, techniek en risico", () => {
  assert.equal(stripsAreConfidential(["risico", "financieel", "technisch"]), true);
  assert.equal(stripsAreConfidential(["locatie", "financieel", "technisch"]), false);
  assert.equal(isHiddenConclusion("Vertrouwelijke financiële en technische gegevens over de stadionontwikkeling."), true);
  assert.equal(isHiddenConclusion("Alleen de algemene toekomstplannen."), false);
});

test("dossier 2 opent na dossier 1 en telt drie nieuwe opdrachten", () => {
  assert.equal(dossier1Complete("done", 2), true);
  assert.equal(dossier1Complete("playing", 2), false);
  assert.equal(dossier2DoneCount("done", 2), 0);
  assert.equal(dossier2DoneCount("playing", 3), 1);
  assert.equal(dossier2DoneCount("playing", 4), 2);
  assert.equal(dossier2Complete("done", 5), true);
});
