import '../dicom/study.dart';

/// Structured draft report assembled from the study's metadata.
/// This is a demo pipeline: the text is a template pre-fill that the
/// physician reviews and edits — not a diagnostic conclusion.
class DraftReport {
  final String findings;
  final String impression;
  final String recommendations;
  DraftReport(this.findings, this.impression, this.recommendations);
}

DraftReport generateDraftReport(DicomStudy study) {
  final modality = _modalityName(study.modality);
  final area = study.bodyPart != '—' ? study.bodyPart : study.description;

  final findings = '''
ПРОТОКОЛ ИССЛЕДОВАНИЯ ($modality)
Область: $area
Серия: ${study.slices.length} срезов, толщина среза ${study.sliceThickness}.

ОПИСАНИЕ:
На серии ${_seriesWord(study.modality)} получены изображения исследуемой области. Анатомические структуры дифференцированы, взаимное расположение сохранено. Костно-деструктивных изменений на уровне визуализации не определяется. Мягкие ткани без видимых объёмных образований.

Очаговых изменений с патологическим сигналом на представленных срезах достоверно не выявлено. Для уточнения состояния отдельных структур рекомендуется сопоставление с клинической картиной и данными предыдущих исследований.''';

  const impression =
      'Данных за острую хирургическую или очаговую патологию на представленных срезах не получено. Черновик сформирован автоматически и требует верификации врачом.';

  const recommendations =
      'Консультация профильного специалиста по клиническим показаниям. Динамическое наблюдение. При наличии клиники — расширенный протокол исследования с контрастным усилением.';

  return DraftReport(findings, impression, recommendations);
}

String _modalityName(String code) {
  switch (code.toUpperCase()) {
    case 'MR':
      return 'МРТ';
    case 'CT':
      return 'МСКТ';
    case 'CR':
    case 'DX':
      return 'Рентгенография';
    case 'US':
      return 'УЗИ';
    default:
      return code;
  }
}

String _seriesWord(String modality) {
  switch (modality.toUpperCase()) {
    case 'MR':
      return 'МР-томограмм';
    case 'CT':
      return 'компьютерных томограмм';
    default:
      return 'изображений';
  }
}
