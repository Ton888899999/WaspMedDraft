import 'dart:convert';
import 'dart:ui' as ui;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../dicom/slice_renderer.dart';
import '../dicom/study.dart';
import '../main.dart';
import '../services/report_generator.dart';

enum ModelState { notLoaded, loading, ready }

enum PipelineState { idle, running, done }

class WorkspaceScreen extends StatefulWidget {
  const WorkspaceScreen({super.key});

  @override
  State<WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends State<WorkspaceScreen> {
  // Study
  DicomStudy? _study;
  String? _zipName;
  bool _loadingStudy = false;
  String? _loadError;

  // Viewer
  int _slice = 0;
  WindowPreset _preset = WindowPreset.auto;
  bool _inverted = false;
  final Map<String, ui.Image> _imageCache = {};
  ui.Image? _currentImage;
  final TransformationController _viewTransform = TransformationController();

  // AI model
  ModelState _modelState = ModelState.notLoaded;
  double _modelProgress = 0;
  String _modelStage = '';

  // Generation pipeline
  PipelineState _pipeline = PipelineState.idle;
  int _pipelineStep = 0;
  double _pipelineProgress = 0;

  // Report
  final _findingsCtrl = TextEditingController();
  final _impressionCtrl = TextEditingController();
  final _recommendationsCtrl = TextEditingController();
  bool _signed = false;
  String? _signedAt;

  static const _pipelineSteps = [
    'Предобработка и нормализация срезов',
    'Сегментация анатомических структур',
    'Анализ и поиск отклонений',
    'Формирование текста протокола',
  ];

  @override
  void dispose() {
    _findingsCtrl.dispose();
    _impressionCtrl.dispose();
    _recommendationsCtrl.dispose();
    _viewTransform.dispose();
    super.dispose();
  }

  // ---------- ZIP loading ----------

  Future<void> _pickZip() async {
    final file = await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: ['zip'],
      dialogTitle: 'Выберите ZIP-архив с DICOM-исследованием',
    );
    if (file == null) return;

    setState(() {
      _loadingStudy = true;
      _loadError = null;
      _zipName = file.name;
    });

    try {
      final bytes = await file.readAsBytes();
      final study = await compute(loadStudyFromZipBytes, bytes);
      _imageCache.clear();
      setState(() {
        _study = study;
        _slice = study.slices.length ~/ 2;
        _preset = WindowPreset.auto;
        _inverted = false;
        _pipeline = PipelineState.idle;
        _signed = false;
        _signedAt = null;
        _findingsCtrl.clear();
        _impressionCtrl.clear();
        _recommendationsCtrl.clear();
        _loadingStudy = false;
      });
      _renderCurrent();
      _toast(
          'Загружено ${study.slices.length} срезов${study.skippedFiles > 0 ? ', пропущено файлов: ${study.skippedFiles}' : ''}');
    } on StudyLoadException catch (e) {
      setState(() {
        _loadingStudy = false;
        _loadError = e.message;
      });
    } catch (e) {
      setState(() {
        _loadingStudy = false;
        _loadError = 'Не удалось обработать архив: $e';
      });
    }
  }

  // ---------- Rendering ----------

  Future<void> _renderCurrent() async {
    final study = _study;
    if (study == null) return;
    final slice = study.slices[_slice];
    if (!slice.renderable) {
      setState(() => _currentImage = null);
      return;
    }
    final key = '$_slice|${_preset.id}|$_inverted';
    final cached = _imageCache[key];
    if (cached != null) {
      setState(() => _currentImage = cached);
      return;
    }
    final img = await renderSlice(slice, _preset, _inverted);
    if (_imageCache.length > 60) _imageCache.clear();
    _imageCache[key] = img;
    if (!mounted) return;
    setState(() => _currentImage = img);
  }

  void _setSlice(int value) {
    setState(() => _slice = value.clamp(0, (_study?.slices.length ?? 1) - 1));
    _renderCurrent();
  }

  // ---------- Model loading (demo initialization) ----------

  Future<void> _loadModel() async {
    setState(() {
      _modelState = ModelState.loading;
      _modelProgress = 0;
    });
    const stages = [
      ('Загрузка весов модели (WaspMed-RadNet v3.0)', 0.45),
      ('Инициализация вычислительного ускорителя', 0.75),
      ('Прогрев модели на эталонном срезе', 1.0),
    ];
    for (final (label, target) in stages) {
      if (!mounted) return;
      setState(() => _modelStage = label);
      while (_modelProgress < target) {
        await Future.delayed(const Duration(milliseconds: 90));
        if (!mounted) return;
        setState(() => _modelProgress = (_modelProgress + 0.035).clamp(0, target));
      }
    }
    if (!mounted) return;
    setState(() => _modelState = ModelState.ready);
    _toast('Модель загружена и готова к работе');
  }

  // ---------- Draft generation (demo pipeline) ----------

  Future<void> _generate() async {
    final study = _study;
    if (study == null || _modelState != ModelState.ready) return;
    setState(() {
      _pipeline = PipelineState.running;
      _pipelineStep = 0;
      _pipelineProgress = 0;
      _signed = false;
      _signedAt = null;
    });
    for (var i = 0; i < _pipelineSteps.length; i++) {
      if (!mounted) return;
      setState(() {
        _pipelineStep = i;
        _pipelineProgress = (i + 0.2) / _pipelineSteps.length;
      });
      await Future.delayed(Duration(milliseconds: 650 + i * 150));
      if (!mounted) return;
      setState(() => _pipelineProgress = (i + 1) / _pipelineSteps.length);
    }
    final draft = generateDraftReport(study);
    if (!mounted) return;
    setState(() {
      _pipeline = PipelineState.done;
      _findingsCtrl.text = draft.findings;
      _impressionCtrl.text = draft.impression;
      _recommendationsCtrl.text = draft.recommendations;
    });
    _toast('Черновик протокола сформирован — проверьте и отредактируйте');
  }

  // ---------- Report actions ----------

  String get _fullReportText {
    final study = _study!;
    final buf = StringBuffer()
      ..writeln('WaspMed Draft — черновик протокола')
      ..writeln('Пациент: ${study.patientName} (${study.patientId})')
      ..writeln('Исследование: ${study.description} · ${study.studyDate} ${study.studyTime}')
      ..writeln('')
      ..writeln(_findingsCtrl.text)
      ..writeln('')
      ..writeln('ЗАКЛЮЧЕНИЕ:')
      ..writeln(_impressionCtrl.text)
      ..writeln('')
      ..writeln('РЕКОМЕНДАЦИИ:')
      ..writeln(_recommendationsCtrl.text)
      ..writeln('');
    buf.writeln(_signed
        ? 'Подписано врачом: $_signedAt'
        : 'Черновик сформирован ИИ и ожидает подписи врача.');
    return buf.toString();
  }

  Future<void> _copyReport() async {
    await Clipboard.setData(ClipboardData(text: _fullReportText));
    _toast('Протокол скопирован в буфер обмена');
  }

  Future<void> _saveReport() async {
    final uri = await FilePicker.saveFile(
      dialogTitle: 'Сохранить протокол',
      fileName: 'protocol_${_study?.patientId ?? 'draft'}.txt',
      bytes: utf8.encode(_fullReportText),
      mimeType: 'text/plain',
    );
    if (uri == null) return;
    _toast('Протокол сохранён: ${uri.toFilePath()}');
  }

  void _sign() {
    final now = DateTime.now();
    String two(int v) => v.toString().padLeft(2, '0');
    setState(() {
      _signed = true;
      _signedAt =
          '${two(now.day)}.${two(now.month)}.${now.year} ${two(now.hour)}:${two(now.minute)}';
    });
    _toast('Протокол подписан электронной подписью врача');
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg, style: const TextStyle(color: AppColors.text)),
        backgroundColor: AppColors.panel,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppColors.border),
        ),
      ));
  }

  // ---------- UI ----------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          _topBar(),
          Expanded(
            child: _study == null ? _uploadScreen() : _workspace(),
          ),
        ],
      ),
    );
  }

  Widget _topBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.panelAlt,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          const Icon(Icons.hexagon_outlined, color: AppColors.cyan, size: 26),
          const SizedBox(width: 10),
          RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 17, color: AppColors.text, fontWeight: FontWeight.w500),
              children: [
                TextSpan(text: 'WaspMed '),
                TextSpan(text: 'Draft', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.cyan)),
              ],
            ),
          ),
          const SizedBox(width: 14),
          _chip(
            _modelState == ModelState.ready ? 'Модель: готова' : 'Модель: не загружена',
            _modelState == ModelState.ready ? AppColors.green : AppColors.muted,
          ),
          const Spacer(),
          if (_study != null)
            TextButton.icon(
              onPressed: _loadingStudy ? null : _pickZip,
              icon: const Icon(Icons.archive_outlined, size: 18, color: AppColors.cyan),
              label: Text(
                _zipName ?? 'Загрузить другой ZIP',
                style: const TextStyle(color: AppColors.cyan, fontSize: 13),
              ),
            ),
        ],
      ),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.4)),
        color: color.withValues(alpha: 0.08),
      ),
      child: Text(text, style: TextStyle(fontSize: 11.5, color: color, fontWeight: FontWeight.w600)),
    );
  }

  // ---------- Upload screen ----------

  Widget _uploadScreen() {
    return Center(
      child: Container(
        width: 520,
        padding: const EdgeInsets.all(36),
        decoration: BoxDecoration(
          color: AppColors.panel,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: AppColors.blue.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.blue.withValues(alpha: 0.25)),
              ),
              child: const Icon(Icons.folder_zip_outlined, color: AppColors.cyan, size: 30),
            ),
            const SizedBox(height: 18),
            const Text('Загрузите исследование',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 8),
            const Text(
              'ZIP-архив с DICOM-файлами (МРТ / КТ). Все данные обрабатываются локально на этом компьютере и никуда не передаются.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.muted, height: 1.5),
            ),
            const SizedBox(height: 24),
            if (_loadingStudy) ...[
              const CircularProgressIndicator(color: AppColors.cyan, strokeWidth: 3),
              const SizedBox(height: 12),
              Text('Распаковка и парсинг $_zipName…',
                  style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
            ] else
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _pickZip,
                icon: const Icon(Icons.upload_file, size: 20),
                label: const Text('Выбрать ZIP с DICOM',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            if (_loadError != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppColors.red.withValues(alpha: 0.08),
                  border: Border.all(color: AppColors.red.withValues(alpha: 0.35)),
                ),
                child: Text(_loadError!,
                    style: const TextStyle(fontSize: 12.5, color: AppColors.red, height: 1.4)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ---------- Workspace ----------

  Widget _workspace() {
    return LayoutBuilder(builder: (context, constraints) {
      final narrow = constraints.maxWidth < 980;
      final viewer = _viewerColumn();
      final ai = _aiColumn();
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: narrow
            ? Column(children: [viewer, const SizedBox(height: 16), ai])
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: viewer),
                  const SizedBox(width: 16),
                  Expanded(child: ai),
                ],
              ),
      );
    });
  }

  // ---------- Left column: viewer ----------

  Widget _viewerColumn() {
    final study = _study!;
    final slice = study.slices[_slice];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _panel(
          padding: EdgeInsets.zero,
          child: AspectRatio(
            aspectRatio: 1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                color: Colors.black,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (_currentImage != null)
                      InteractiveViewer(
                        transformationController: _viewTransform,
                        maxScale: 8,
                        child: RawImage(
                          image: _currentImage,
                          fit: BoxFit.contain,
                          filterQuality: FilterQuality.medium,
                        ),
                      )
                    else
                      Center(
                        child: Text(
                          slice.renderable
                              ? 'Рендеринг…'
                              : 'Срез в сжатом формате —\nпросмотр недоступен, метаданные обработаны',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.muted, fontSize: 13),
                        ),
                      ),
                    Positioned(
                      left: 10,
                      top: 8,
                      child: _overlayText(
                          '${study.modality} · ${slice.fileName}\n${slice.columns} × ${slice.rows}'),
                    ),
                    Positioned(
                      right: 10,
                      bottom: 8,
                      child: _overlayText('Срез ${_slice + 1} / ${study.slices.length}',
                          alignRight: true),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        _panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Text('Срез', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                  Expanded(
                    child: Slider(
                      value: _slice.toDouble(),
                      min: 0,
                      max: (study.slices.length - 1).toDouble(),
                      onChanged: (v) => _setSlice(v.round()),
                    ),
                  ),
                  SizedBox(
                    width: 52,
                    child: Text('${_slice + 1}/${study.slices.length}',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                            fontSize: 12.5, color: AppColors.cyan, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final p in WindowPreset.all)
                    ChoiceChip(
                      label: Text(p.label, style: const TextStyle(fontSize: 12)),
                      selected: _preset.id == p.id,
                      selectedColor: AppColors.blue.withValues(alpha: 0.25),
                      backgroundColor: AppColors.panelAlt,
                      side: BorderSide(
                          color: _preset.id == p.id ? AppColors.cyan : AppColors.border),
                      labelStyle: TextStyle(
                          color: _preset.id == p.id ? AppColors.cyan : AppColors.muted),
                      onSelected: (_) {
                        setState(() => _preset = p);
                        _renderCurrent();
                      },
                    ),
                  FilterChip(
                    label: const Text('Инверсия', style: TextStyle(fontSize: 12)),
                    selected: _inverted,
                    selectedColor: AppColors.blue.withValues(alpha: 0.25),
                    backgroundColor: AppColors.panelAlt,
                    side: BorderSide(color: _inverted ? AppColors.cyan : AppColors.border),
                    labelStyle:
                        TextStyle(color: _inverted ? AppColors.cyan : AppColors.muted),
                    onSelected: (v) {
                      setState(() => _inverted = v);
                      _renderCurrent();
                    },
                  ),
                  ActionChip(
                    label: const Text('Сброс вида', style: TextStyle(fontSize: 12)),
                    backgroundColor: AppColors.panelAlt,
                    side: const BorderSide(color: AppColors.border),
                    labelStyle: const TextStyle(color: AppColors.muted),
                    onPressed: () => _viewTransform.value = Matrix4.identity(),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _metadataCard(study),
      ],
    );
  }

  Widget _overlayText(String text, {bool alignRight = false}) {
    return Text(
      text,
      textAlign: alignRight ? TextAlign.right : TextAlign.left,
      style: TextStyle(
        fontSize: 11,
        height: 1.35,
        color: AppColors.cyan.withValues(alpha: 0.85),
        fontFeatures: const [ui.FontFeature.tabularFigures()],
        shadows: const [Shadow(color: Colors.black, blurRadius: 4)],
      ),
    );
  }

  Widget _metadataCard(DicomStudy study) {
    final rows = <(String, String)>[
      ('Пациент', study.patientName),
      ('ID / Возраст·Пол', '${study.patientId} · ${study.patientAgeSex}'),
      ('Исследование', study.description),
      ('Дата · Время', '${study.studyDate} · ${study.studyTime}'),
      ('Модальность', study.modality),
      ('Область', study.bodyPart),
      ('Аппарат', study.deviceModel),
      ('Учреждение', study.institution),
      ('Срезов · Толщина', '${study.slices.length} · ${study.sliceThickness}'),
    ];
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('МЕТАДАННЫЕ DICOM',
              style: TextStyle(
                  fontSize: 11, letterSpacing: 1.2, color: AppColors.muted, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          for (final (k, v) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                      width: 150,
                      child: Text(k, style: const TextStyle(fontSize: 12, color: AppColors.muted))),
                  Expanded(
                      child: Text(v,
                          style: const TextStyle(
                              fontSize: 12.5, color: AppColors.text, fontWeight: FontWeight.w500))),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ---------- Right column: AI ----------

  Widget _aiColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _modelCard(),
        const SizedBox(height: 12),
        _generateCard(),
        if (_pipeline == PipelineState.done) ...[
          const SizedBox(height: 12),
          _reportEditor(),
          const SizedBox(height: 12),
          _actionBar(),
        ],
      ],
    );
  }

  Widget _modelCard() {
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                _modelState == ModelState.ready ? Icons.memory : Icons.downloading,
                color: _modelState == ModelState.ready ? AppColors.green : AppColors.cyan,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text('AI-модель',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              _chip(
                switch (_modelState) {
                  ModelState.notLoaded => 'не загружена',
                  ModelState.loading => 'загрузка…',
                  ModelState.ready => 'готова',
                },
                switch (_modelState) {
                  ModelState.notLoaded => AppColors.muted,
                  ModelState.loading => AppColors.amber,
                  ModelState.ready => AppColors.green,
                },
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_modelState == ModelState.notLoaded) ...[
            const Text(
              'Загрузите модель анализа изображений. Модель работает полностью локально — данные пациента не покидают компьютер.',
              style: TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.5),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.blue,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _loadModel,
              icon: const Icon(Icons.download, size: 18),
              label: const Text('Загрузить модель', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ] else if (_modelState == ModelState.loading) ...[
            Text(_modelStage, style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: _modelProgress,
                minHeight: 6,
                backgroundColor: AppColors.border,
                color: AppColors.cyan,
              ),
            ),
          ] else
            const Text(
              'WaspMed-RadNet v3.0 · режим инференса · локальное выполнение',
              style: TextStyle(fontSize: 12.5, color: AppColors.muted),
            ),
        ],
      ),
    );
  }

  Widget _generateCard() {
    final ready = _modelState == ModelState.ready && _pipeline != PipelineState.running;
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: ready ? AppColors.cyan : AppColors.border,
              foregroundColor: ready ? Colors.black : AppColors.muted,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: ready ? _generate : null,
            icon: const Icon(Icons.auto_awesome, size: 19),
            label: Text(
              _pipeline == PipelineState.done
                  ? 'Перегенерировать черновик'
                  : 'Сгенерировать черновик протокола',
              style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700),
            ),
          ),
          if (_modelState != ModelState.ready) ...[
            const SizedBox(height: 8),
            const Text('Сначала загрузите модель',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11.5, color: AppColors.muted)),
          ],
          if (_pipeline == PipelineState.running) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: _pipelineProgress,
                minHeight: 6,
                backgroundColor: AppColors.border,
                color: AppColors.cyan,
              ),
            ),
            const SizedBox(height: 12),
            for (var i = 0; i < _pipelineSteps.length; i++)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Icon(
                      i < _pipelineStep
                          ? Icons.check_circle
                          : i == _pipelineStep
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                      size: 16,
                      color: i < _pipelineStep
                          ? AppColors.green
                          : i == _pipelineStep
                              ? AppColors.cyan
                              : AppColors.border,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _pipelineSteps[i],
                      style: TextStyle(
                        fontSize: 12.5,
                        color: i <= _pipelineStep ? AppColors.text : AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
          ],
          if (_pipeline == PipelineState.idle && _modelState == ModelState.ready) ...[
            const SizedBox(height: 10),
            const Text(
              'Модель проанализирует загруженную серию и подготовит структурированный черновик описания и заключения.',
              style: TextStyle(fontSize: 12, color: AppColors.muted, height: 1.5),
            ),
          ],
        ],
      ),
    );
  }

  Widget _reportEditor() {
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text('ЧЕРНОВИК ПРОТОКОЛА',
                  style: TextStyle(
                      fontSize: 11, letterSpacing: 1.2, color: AppColors.muted, fontWeight: FontWeight.w700)),
              const Spacer(),
              _chip(_signed ? 'подписан' : 'ожидает подписи',
                  _signed ? AppColors.green : AppColors.amber),
            ],
          ),
          const SizedBox(height: 12),
          _reportField('Описание', _findingsCtrl, minLines: 8),
          const SizedBox(height: 10),
          _reportField('Заключение', _impressionCtrl, minLines: 3),
          const SizedBox(height: 10),
          _reportField('Рекомендации', _recommendationsCtrl, minLines: 3),
        ],
      ),
    );
  }

  Widget _reportField(String label, TextEditingController ctrl, {int minLines = 3}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.cyan, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          minLines: minLines,
          maxLines: null,
          onChanged: (_) {
            if (_signed) setState(() => _signed = false);
          },
          style: const TextStyle(fontSize: 13, color: AppColors.text, height: 1.55),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.panelAlt,
            contentPadding: const EdgeInsets.all(12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.cyan),
            ),
          ),
        ),
      ],
    );
  }

  Widget _actionBar() {
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _copyReport,
                  icon: const Icon(Icons.copy, size: 16, color: AppColors.muted),
                  label: const Text('Копировать',
                      style: TextStyle(fontSize: 13, color: AppColors.text)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _saveReport,
                  icon: const Icon(Icons.save_alt, size: 16, color: AppColors.muted),
                  label: const Text('Сохранить .txt',
                      style: TextStyle(fontSize: 13, color: AppColors.text)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: _signed ? AppColors.green.withValues(alpha: 0.2) : AppColors.green,
              foregroundColor: _signed ? AppColors.green : Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: _signed ? null : _sign,
            icon: Icon(_signed ? Icons.verified : Icons.draw, size: 18),
            label: Text(
              _signed ? 'Подписано · $_signedAt' : 'Подписать протокол',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Черновик сформирован ИИ и не является диагнозом. Клиническое решение и подпись остаются за врачом.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: AppColors.muted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _panel({required Widget child, EdgeInsets? padding}) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}
