// =====================================================================
// Seed Script: Initializes the platform with default data.
// Run via: bun run db:seed
// =====================================================================
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const ANSWER_TYPES = {
  SHORT_TEXT: 'SHORT_TEXT',
  LONG_TEXT: 'LONG_TEXT',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  RATING_1_5: 'RATING_1_5',
  RATING_LEVELS: 'RATING_LEVELS',
  YES_NO: 'YES_NO',
  URL: 'URL',
}

async function main() {
  console.log('🌱 Starting platform seed...')

  // ---------- 1. Admin user ----------
  const adminPassword = await bcrypt.hash('Admin@12345', 12)
  const admin = await db.user.upsert({
    where: { email: 'admin@platform.edu' },
    update: {},
    create: {
      email: 'admin@platform.edu',
      name: 'مدير المنصة',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  })
  console.log('  ✓ Admin user created:', admin.email)

  // ---------- 2. Academic Levels ----------
  const levels = await Promise.all(
    [
      { name: 'السنة الأولى', description: 'السنة الدراسية الأولى', sortOrder: 1 },
      { name: 'السنة الثانية', description: 'السنة الدراسية الثانية', sortOrder: 2 },
      { name: 'السنة الثالثة', description: 'السنة الدراسية الثالثة', sortOrder: 3 },
      { name: 'السنة الرابعة', description: 'السنة الدراسية الرابعة', sortOrder: 4 },
      { name: 'دراسات عليا', description: 'طلاب الماجستير والدكتوراه', sortOrder: 5 },
    ].map((lvl) => db.academicLevel.upsert({ where: { name: lvl.name }, update: {}, create: lvl })),
  )
  console.log('  ✓ Academic levels:', levels.length)

  // ---------- 3. Question Categories ----------
  const categorySeed = [
    { name: 'التعرف على الموقع', description: 'فهم طبيعة الموقع والنشاط التجاري', sortOrder: 1 },
    { name: 'تجربة المستخدم والتصفح', description: 'سهولة الاستخدام والتنقل', sortOrder: 2 },
    { name: 'صفحة المنتج أو الخدمة', description: 'محتوى وعرض المنتجات', sortOrder: 3 },
    { name: 'خطوات الطلب والشراء', description: 'عملية الشراء والدفع', sortOrder: 4 },
    { name: 'الثقة والتحسين', description: 'تقييم الموثوقية وفرص التحسين', sortOrder: 5 },
  ]
  const categories = []
  for (const cat of categorySeed) {
    let c = await db.questionCategory.findFirst({ where: { name: cat.name } })
    if (!c) {
      c = await db.questionCategory.create({ data: cat })
    }
    categories.push(c)
  }
  console.log('  ✓ Question categories:', categories.length)

  // ---------- 4. Questions ----------
  type QSeed = {
    categoryIdx: number
    text: string
    description?: string
    answerType: string
    isRequired: boolean
    sortOrder: number
    options?: { text: string; value: string }[]
  }

  const questions: QSeed[] = [
    // ---- Section 1: التعرف على الموقع ----
    {
      categoryIdx: 0,
      text: 'ما اسم الموقع؟ وما نوع المنتجات أو الخدمات التي يقدمها؟',
      description: 'اذكر الاسم الرسمي للموقع ونوع النشاط التجاري بشكل مختصر.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 1,
    },
    {
      categoryIdx: 0,
      text: 'من الجمهور المستهدف للموقع؟',
      description: 'حدد الفئة العمرية أو المهنية أو الجغرافية المستهدفة.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 2,
    },
    {
      categoryIdx: 0,
      text: 'ما نوع التجارة الإلكترونية التي يمثّلها؟',
      answerType: ANSWER_TYPES.SINGLE_CHOICE,
      isRequired: true,
      sortOrder: 3,
      options: [
        { text: 'B2C (من الشركة للمستهلك)', value: 'B2C' },
        { text: 'B2B (من الشركة للشركة)', value: 'B2B' },
        { text: 'C2C (من مستهلك لمستهلك)', value: 'C2C' },
        { text: 'غير ذلك', value: 'OTHER' },
      ],
    },
    {
      categoryIdx: 0,
      text: 'هل هو سوق يجمع بائعين متعددين، أم متجر يبيع منتجاته، أم منصة لبيع الخدمات؟',
      answerType: ANSWER_TYPES.SINGLE_CHOICE,
      isRequired: true,
      sortOrder: 4,
      options: [
        { text: 'سوق متعدد البائعين (Marketplace)', value: 'MARKETPLACE' },
        { text: 'متجر يبيع منتجاته (Single Store)', value: 'SINGLE_STORE' },
        { text: 'منصة خدمات (Service Platform)', value: 'SERVICES' },
        { text: 'هجين / غير محدد', value: 'HYBRID' },
      ],
    },

    // ---- Section 2: تجربة المستخدم والتصفح ----
    {
      categoryIdx: 1,
      text: 'هل يسهل العثور على المنتج أو الخدمة المطلوبة؟ كيف؟',
      description: 'صف تجربتك في العثور على منتج محدد.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 1,
    },
    {
      categoryIdx: 1,
      text: 'هل توجد تصنيفات أو خاصية بحث أو فلاتر؟ جرّبوها.',
      description: 'اذكر التصنيفات المتاحة وكيف تعمل خاصية البحث والفلاتر.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 2,
    },
    {
      categoryIdx: 1,
      text: 'هل يعمل الموقع بوضوح على شاشة الهاتف؟ وهل النصوص والأزرار سهلة الاستخدام؟',
      answerType: ANSWER_TYPES.RATING_LEVELS,
      isRequired: true,
      sortOrder: 3,
      options: [
        { text: 'ممتاز', value: 'EXCELLENT' },
        { text: 'جيد', value: 'GOOD' },
        { text: 'متوسط', value: 'AVERAGE' },
        { text: 'ضعيف', value: 'POOR' },
      ],
    },

    // ---- Section 3: صفحة المنتج أو الخدمة ----
    {
      categoryIdx: 2,
      text: 'هل الاسم والوصف والصور واضحة؟',
      answerType: ANSWER_TYPES.RATING_LEVELS,
      isRequired: true,
      sortOrder: 1,
      options: [
        { text: 'ممتاز', value: 'EXCELLENT' },
        { text: 'جيد', value: 'GOOD' },
        { text: 'متوسط', value: 'AVERAGE' },
        { text: 'ضعيف', value: 'POOR' },
      ],
    },
    {
      categoryIdx: 2,
      text: 'هل السعر ظاهر؟ وهل توجد معلومات عن التوصيل أو مدة تنفيذ الخدمة؟',
      answerType: ANSWER_TYPES.YES_NO,
      isRequired: true,
      sortOrder: 2,
      options: [
        { text: 'نعم', value: 'YES' },
        { text: 'لا', value: 'NO' },
        { text: 'جزئيًا', value: 'PARTIAL' },
      ],
    },
    {
      categoryIdx: 2,
      text: 'هل تظهر تقييمات العملاء أو آراءهم أو معلومات تساعد على الثقة؟',
      answerType: ANSWER_TYPES.YES_NO,
      isRequired: true,
      sortOrder: 3,
      options: [
        { text: 'نعم', value: 'YES' },
        { text: 'لا', value: 'NO' },
      ],
    },

    // ---- Section 4: خطوات الطلب والشراء ----
    {
      categoryIdx: 3,
      text: 'هل يمكن إضافة المنتج إلى السلة أو بدء طلب الخدمة؟',
      answerType: ANSWER_TYPES.YES_NO,
      isRequired: true,
      sortOrder: 1,
      options: [
        { text: 'نعم', value: 'YES' },
        { text: 'لا', value: 'NO' },
      ],
    },
    {
      categoryIdx: 3,
      text: 'ما الخطوات التي يمر بها العميل حتى تأكيد الطلب؟',
      description: 'صف الخطوات بالترتيب.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 2,
    },
    {
      categoryIdx: 3,
      text: 'هل يوضح الموقع طرق الدفع والتوصيل أو الاستلام؟',
      answerType: ANSWER_TYPES.RATING_1_5,
      isRequired: true,
      sortOrder: 3,
    },
    {
      categoryIdx: 3,
      text: 'هل توجد خطوة غير واضحة أو معقدة قد تجعل العميل يتراجع عن الشراء؟',
      description: 'اذكر الخطوة وما الذي يجعلها معقدة.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: false,
      sortOrder: 4,
    },

    // ---- Section 5: الثقة والتحسين ----
    {
      categoryIdx: 4,
      text: 'ما الذي يجعل الموقع موثوقًا أو غير موثوق في نظر العميل؟',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 1,
    },
    {
      categoryIdx: 4,
      text: 'اذكروا ميزة واحدة أعجبتكم فيه.',
      answerType: ANSWER_TYPES.SHORT_TEXT,
      isRequired: true,
      sortOrder: 2,
    },
    {
      categoryIdx: 4,
      text: 'اذكروا مشكلة أو نقطة ضعف لاحظتموها.',
      answerType: ANSWER_TYPES.SHORT_TEXT,
      isRequired: true,
      sortOrder: 3,
    },
    {
      categoryIdx: 4,
      text: 'اقترحوا تحسينًا واحدًا يجعل تجربة العميل أفضل.',
      answerType: ANSWER_TYPES.LONG_TEXT,
      isRequired: true,
      sortOrder: 4,
    },
  ]

  // Create or update questions + options
  for (const q of questions) {
    const existing = await db.question.findFirst({ where: { text: q.text } })
    if (existing) {
      // Update text/description/type but keep options fresh
      await db.question.update({
        where: { id: existing.id },
        data: {
          categoryId: categories[q.categoryIdx].id,
          description: q.description,
          answerType: q.answerType,
          isRequired: q.isRequired,
          sortOrder: q.sortOrder,
          status: 'ACTIVE',
        },
      })
      // Replace options
      await db.questionOption.deleteMany({ where: { questionId: existing.id } })
      if (q.options) {
        for (let i = 0; i < q.options.length; i++) {
          await db.questionOption.create({
            data: {
              questionId: existing.id,
              text: q.options[i].text,
              value: q.options[i].value,
              sortOrder: i,
            },
          })
        }
      }
    } else {
      const created = await db.question.create({
        data: {
          categoryId: categories[q.categoryIdx].id,
          text: q.text,
          description: q.description,
          answerType: q.answerType,
          isRequired: q.isRequired,
          sortOrder: q.sortOrder,
          status: 'ACTIVE',
        },
      })
      if (q.options) {
        for (let i = 0; i < q.options.length; i++) {
          await db.questionOption.create({
            data: {
              questionId: created.id,
              text: q.options[i].text,
              value: q.options[i].value,
              sortOrder: i,
            },
          })
        }
      }
    }
  }
  const allQuestions = await db.question.findMany({ where: { status: 'ACTIVE' }, include: { options: true } })
  console.log('  ✓ Questions:', allQuestions.length)

  // ---------- 5. Publish initial Question Set Version ----------
  const existingSet = await db.questionSetVersion.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { versionNumber: 'desc' },
  })
  if (!existingSet) {
    const maxVersion = await db.questionSetVersion.aggregate({ _max: { versionNumber: true } })
    const versionNumber = (maxVersion._max.versionNumber ?? 0) + 1
    const setVersion = await db.questionSetVersion.create({
      data: {
        versionNumber,
        label: `الإصدار الأول - ${new Date().toLocaleDateString('ar')}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    // Create immutable snapshots
    for (const q of allQuestions) {
      const qv = await db.questionVersion.create({
        data: {
          questionId: q.id,
          versionNumber: q.currentVersionNumber,
          snapshotText: q.text,
          snapshotDescription: q.description,
          snapshotAnswerType: q.answerType,
          snapshotIsRequired: q.isRequired,
          snapshotOptions: JSON.stringify(q.options.map((o) => ({ text: o.text, value: o.value }))),
        },
      })
      await db.questionSetVersionItem.create({
        data: {
          setVersionId: setVersion.id,
          questionVersionId: qv.id,
          sortOrder: q.sortOrder,
          isRequired: q.isRequired,
        },
      })
    }
    console.log('  ✓ Question Set Version published: v' + versionNumber)
  } else {
    console.log('  ✓ Question Set Version already exists (v' + existingSet.versionNumber + ')')
  }

  // ---------- 6. Suggested websites ----------
  const websites = [
    { name: 'Amazon', url: 'https://www.amazon.com', description: 'أكبر متجر إلكتروني متعدد المنتجات عالميًا', businessType: 'B2C' },
    { name: 'eBay', url: 'https://www.ebay.com', description: 'منصة مزاد وبيع بين الأفراد والشركات', businessType: 'C2C' },
    { name: 'Etsy', url: 'https://www.etsy.com', description: 'منصة للمنتجات اليدوية والفريدة', businessType: 'C2C' },
    { name: 'Noon', url: 'https://www.noon.com', description: 'متجر إلكتروني إقليمي للمنتجات المتنوعة', businessType: 'B2C' },
    { name: 'Jumia', url: 'https://www.jumia.com', description: 'متجر إلكتروني أفريقي رائد', businessType: 'B2C' },
    { name: 'AliExpress', url: 'https://www.aliexpress.com', description: 'منصة بيع بالتجزئة من الصين للعالم', businessType: 'B2C' },
    { name: 'Shopify Store', url: 'https://www.shopify.com', description: 'منصة إنشاء المتاجر الإلكترونية', businessType: 'B2B' },
  ]
  for (const w of websites) {
    await db.suggestedWebsite.upsert({
      where: { url: w.url },
      update: {},
      create: { ...w, isActive: true },
    })
  }
  console.log('  ✓ Suggested websites:', websites.length)

  // ---------- 7. System settings ----------
  const settings = [
    { key: 'platform_name', value: 'منصة تحليل ومقارنة المواقع الإلكترونية', description: 'اسم المنصة الظاهر للجميع' },
    { key: 'platform_short_name', value: 'منصة التحليل', description: 'الاسم المختصر' },
    { key: 'min_websites', value: '2', description: 'الحد الأدنى للمواقع في المقارنة' },
    { key: 'max_websites', value: '4', description: 'الحد الأقصى للمواقع في المقارنة' },
    { key: 'assignment_type', value: 'STUDENT_CHOICE', description: 'طريقة تحديد المواقع للطلاب' },
    { key: 'public_comparisons_policy', value: 'AFTER_APPROVED', description: 'سياسة ظهور تحليلات الطلاب: AFTER_SUBMIT | AFTER_APPROVED | HIDDEN' },
    { key: 'allow_edit_after_submit', value: 'false', description: 'السماح بالتعديل بعد الإرسال' },
    { key: 'allow_public_comparisons', value: 'true', description: 'السماح للطلاب بمشاهدة تحليلات الآخرين' },
    { key: 'allow_public_registration', value: 'true', description: 'السماح بالتسجيل العام' },
    { key: 'dark_mode_enabled', value: 'true', description: 'تفعيل الوضع الداكن' },
    { key: 'smtp_from', value: 'noreply@platform.edu', description: 'بريد المرسل' },
    { key: 'require_admin_approval', value: 'false', description: 'اشتراط موافقة الإدارة قبل تفعيل الحساب' },
  ]
  for (const s of settings) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }
  console.log('  ✓ System settings:', settings.length)

  // ---------- 8. Sample students for demo ----------
  const sampleStudents = [
    { name: 'أحمد محمد', email: 'ahmed@demo.edu', levelIdx: 0 },
    { name: 'سارة علي', email: 'sara@demo.edu', levelIdx: 1 },
    { name: 'خالد العتيبي', email: 'khaled@demo.edu', levelIdx: 2 },
  ]
  for (const st of sampleStudents) {
    const pwd = await bcrypt.hash('Student@123', 12)
    const existing = await db.user.findUnique({ where: { email: st.email } })
    if (!existing) {
      const u = await db.user.create({
        data: {
          email: st.email,
          name: st.name,
          passwordHash: pwd,
          role: 'STUDENT',
          isActive: true,
          emailVerified: new Date(),
          studentProfile: {
            create: { academicLevelId: levels[st.levelIdx].id },
          },
        },
      })
      console.log('  ✓ Sample student:', u.email, '(password: Student@123)')
    }
  }

  // ---------- 9. Audit log: seed ----------
  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_SEED',
      description: 'تهيئة النظام بالبيانات الأولية',
    },
  })

  console.log('\n✅ Seed completed successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔐 Admin login:')
  console.log('   Email:    admin@platform.edu')
  console.log('   Password: Admin@12345')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎓 Sample students:')
  console.log('   ahmed@demo.edu  / Student@123')
  console.log('   sara@demo.edu   / Student@123')
  console.log('   khaled@demo.edu / Student@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
