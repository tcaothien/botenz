const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const config = require('./config.json');

// Tải cấu hình môi trường từ file .env
dotenv.config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("Error connecting to MongoDB:", err));

// Khởi tạo bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  balance: { type: Number, default: 0 },
  dailyReceived: { type: Boolean, default: false },
  married: { type: Boolean, default: false },
  partnerId: { type: String, default: null },
  lovePoints: { type: Number, default: 0 },
  autoResponses: [{ message: String, response: String }],
});

const User = mongoose.model('User', userSchema);

// Lắng nghe khi bot đã sẵn sàng
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Lệnh giúp đỡ
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const prefix = "e";

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Lệnh ehelps
    if (command === 'ehelps') {
      const embed = {
        title: "Lệnh Bot",
        description: "Các lệnh hiện có:",
        fields: [
          { name: "ehelps", value: "Hiển thị danh sách lệnh." },
          { name: "exu", value: "Hiển thị số dư của bạn." },
          { name: "edaily", value: "Nhận tiền hàng ngày." },
          { name: "egives [@user] [amount]", value: "Chuyển tiền cho người khác." },
          { name: "emarry [@user]", value: "Cầu hôn (phí 5,000,000 xu)." },
          { name: "edivorce", value: "Ly hôn (phí 5,000,000 xu)." },
          { name: "epmarry", value: "Hiển thị trạng thái kết hôn và điểm yêu thương." }
        ]
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh exu - Hiển thị số dư
    if (command === 'exu') {
      const user = await User.findOne({ userId: message.author.id });
      const embed = {
        title: "Số Dư Của Bạn",
        fields: [
          { name: "Số dư", value: `${user ? user.balance : 0} xu` }
        ]
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh edaily - Nhận tiền hàng ngày
    if (command === 'edaily') {
      const user = await User.findOne({ userId: message.author.id });
      if (!user) {
        const newUser = new User({ userId: message.author.id });
        await newUser.save();
      }

      if (!user.dailyReceived) {
        const dailyAmount = Math.floor(Math.random() * (config.dailyMaxAmount - config.dailyMinAmount + 1)) + config.dailyMinAmount;
        user.balance += dailyAmount;
        user.dailyReceived = true;
        await user.save();

        const embed = {
          title: "Tiền Hàng Ngày",
          description: `Bạn đã nhận được ${dailyAmount} xu!`,
        };
        message.channel.send({ embeds: [embed] });
      } else {
        message.channel.send("Bạn đã nhận tiền hôm nay rồi.");
      }
    }

  // Lệnh egives - Chuyển tiền cho người khác (tiếp)
      const embed = {
        title: "Chuyển Tiền Thành Công",
        description: `Bạn đã chuyển ${amount} xu cho ${targetUser.tag}.`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh emarry - Cầu hôn
    if (command === 'emarry') {
      const targetUser = message.mentions.users.first();
      if (!targetUser) return message.reply("Bạn cần chỉ định người để cầu hôn.");
      if (targetUser.id === message.author.id) return message.reply("Bạn không thể kết hôn với chính mình.");

      const sender = await User.findOne({ userId: message.author.id });
      const receiver = await User.findOne({ userId: targetUser.id });

      if (sender.balance < config.marriageFee) {
        return message.reply("Bạn không đủ tiền để cầu hôn.");
      }

      if (sender.married) {
        return message.reply("Bạn đã kết hôn rồi.");
      }

      if (receiver.married) {
        return message.reply(`${targetUser.tag} đã kết hôn rồi.`);
      }

      sender.balance -= config.marriageFee;
      receiver.balance -= config.marriageFee;

      sender.married = true;
      receiver.married = true;

      sender.partnerId = targetUser.id;
      receiver.partnerId = message.author.id;

      sender.lovePoints = 0;
      receiver.lovePoints = 0;

      await sender.save();
      await receiver.save();

      const embed = {
        title: "Chúc Mừng Cầu Hôn Thành Công",
        description: `Bạn và ${targetUser.tag} đã kết hôn thành công!`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh edivorce - Ly hôn
    if (command === 'edivorce') {
      const user = await User.findOne({ userId: message.author.id });
      if (!user.married) return message.reply("Bạn chưa kết hôn.");
      
      if (user.balance < config.divorceFee) {
        return message.reply("Bạn không đủ tiền để ly hôn.");
      }

      const partner = await User.findOne({ userId: user.partnerId });

      user.balance -= config.divorceFee;
      partner.balance -= config.divorceFee;

      user.married = false;
      partner.married = false;

      user.partnerId = null;
      partner.partnerId = null;

      user.lovePoints = 0;
      partner.lovePoints = 0;

      await user.save();
      await partner.save();

      const embed = {
        title: "Ly Hôn Thành Công",
        description: `Bạn và ${partner.tag} đã ly hôn thành công.`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh epmarry - Hiển thị trạng thái kết hôn và điểm yêu thương
    if (command === 'epmarry') {
      const user = await User.findOne({ userId: message.author.id });

      if (!user.married) {
        return message.reply("Bạn chưa kết hôn.");
      }

      const partner = await User.findOne({ userId: user.partnerId });

      const embed = {
        title: "Trạng Thái Kết Hôn",
        fields: [
          { name: "Kết Hôn", value: `Bạn đã kết hôn với ${partner.tag}.` },
          { name: "Điểm Yêu Thương", value: `${user.lovePoints} điểm` },
        ]
      };
      message.channel.send({ embeds: [embed] });
    }
  }
});

// Đăng nhập bot với token từ .env
client.login(process.env.TOKEN);
