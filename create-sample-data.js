const mongoose = require("mongoose");
const PropertyReview = require("./models/PropertyReview");
const User = require("./models/User");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1/prokvartirukz", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for sample data creation"))
  .catch((err) => console.log("MongoDB connection error:", err));

async function createSampleData() {
  try {
    console.log("Creating sample data for search testing...");

    // First, create a sample user if none exists
    let sampleUser = await User.findOne({ email: "test@example.com" });

    if (!sampleUser) {
      console.log("Creating sample user...");
      sampleUser = new User({
        firstName: "Тест",
        lastName: "Пользователь",
        email: "test@example.com",
        password: "testpassword123",
        emailVerified: true,
        role: "user",
      });
      await sampleUser.save();
      console.log("✓ Sample user created:", sampleUser._id);
    } else {
      console.log("✓ Sample user already exists:", sampleUser._id);
    }

    // Check if sample reviews already exist
    const existingReviews = await PropertyReview.countDocuments({
      city: "Алматы",
      street: "ул. Абая",
      building: "15",
    });

    if (existingReviews === 0) {
      console.log("Creating sample reviews...");

      const sampleReviews = [
        {
          title: "Отличная квартира в центре",
          content:
            "Очень удобная квартира, хороший ремонт, тихий район. Рядом есть магазины, транспорт, парк. Рекомендую всем, кто ищет жилье в центре города.",
          rating: 5,
          author: sampleUser._id,
          city: "Алматы",
          street: "ул. Абая",
          building: "15",
          reviewType: "property",
          isApproved: true,
          numberOfRooms: 2,
          floor: 5,
          totalFloors: 9,
          area: 65,
          price: 250000,
          currency: "KZT",
        },
        {
          title: "ЖК Солнечный - отличное место для жизни",
          content:
            "Современный жилой комплекс с развитой инфраструктурой. Красивый двор, детская площадка, подземная парковка. Охрана работает 24/7.",
          rating: 4,
          author: sampleUser._id,
          city: "Алматы",
          street: "ул. Абая",
          building: "15",
          reviewType: "residentialComplex",
          isApproved: true,
          residentialComplex: "ЖК Солнечный",
        },
        {
          title: "Арендодатель очень отзывчивый и честный",
          content:
            "Всегда помогает с вопросами, быстро реагирует на проблемы. Никогда не задерживает возврат депозита. Очень доволен сотрудничеством.",
          rating: 5,
          author: sampleUser._id,
          city: "Алматы",
          street: "ул. Абая",
          building: "15",
          reviewType: "landlord",
          isApproved: true,
          landlordName: "Иван Петрович",
          landlordPhone: "+7-777-123-45-67",
        },
        {
          title: "Арендатор аккуратный и ответственный",
          content:
            "Своевременно платил аренду, содержал квартиру в чистоте. Никогда не шумел, уважал соседей. Очень доволен таким арендатором.",
          rating: 4,
          author: sampleUser._id,
          city: "Алматы",
          street: "ул. Абая",
          building: "15",
          reviewType: "tenant",
          isApproved: true,
          tenantName: "Алексей Сергеевич",
          tenantPhone: "+7-777-987-65-43",
        },
        {
          title: "Квартира на ул. Достык",
          content:
            "Хорошая квартира в тихом районе. Недалеко от метро, есть все необходимое. Ремонт средний, но цена соответствует качеству.",
          rating: 3,
          author: sampleUser._id,
          city: "Алматы",
          street: "ул. Достык",
          building: "25",
          reviewType: "property",
          isApproved: true,
          numberOfRooms: 1,
          floor: 3,
          totalFloors: 5,
          area: 45,
          price: 180000,
          currency: "KZT",
        },
        {
          title: "ЖК на ул. Толе би",
          content:
            "Новый жилой комплекс с современной планировкой. Хорошая звукоизоляция, качественные материалы. Рекомендую для семей с детьми.",
          rating: 4,
          author: sampleUser._id,
          city: "Алматы",
          street: "ул. Толе би",
          building: "10",
          reviewType: "residentialComplex",
          isApproved: true,
          residentialComplex: "ЖК Современный",
        },
      ];

      for (const reviewData of sampleReviews) {
        const review = new PropertyReview(reviewData);
        await review.save();
        console.log(`✓ Created review: ${review.title}`);
      }

      console.log(`✅ Created ${sampleReviews.length} sample reviews`);
    } else {
      console.log(`✓ Sample reviews already exist (${existingReviews} found)`);
    }

    // Display search test results
    console.log("\n🔍 Testing search functionality...");

    const citySearch = await PropertyReview.find({
      city: new RegExp("Алматы", "i"),
      isApproved: true,
    }).countDocuments();
    console.log(`✓ Reviews in Алматы: ${citySearch}`);

    const streetSearch = await PropertyReview.find({
      street: new RegExp("Абая", "i"),
      isApproved: true,
    }).countDocuments();
    console.log(`✓ Reviews on ул. Абая: ${streetSearch}`);

    const buildingSearch = await PropertyReview.find({
      building: new RegExp("15", "i"),
      isApproved: true,
    }).countDocuments();
    console.log(`✓ Reviews in building 15: ${buildingSearch}`);

    console.log("\n✅ Sample data creation completed!");
    console.log("\n📝 To test the search functionality:");
    console.log("1. Start the backend server: npm start");
    console.log("2. Start the frontend: npm run dev");
    console.log("3. Navigate to /search page");
    console.log("4. Try searching for: Алматы, ул. Абая, 15");
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

createSampleData();
