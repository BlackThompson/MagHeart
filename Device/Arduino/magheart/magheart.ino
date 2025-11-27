// 三个电磁铁异步心跳示例

const int NUM_CHANNELS = 3;

// 三个电磁铁使用的 GPIO 引脚
const int pwmPins[NUM_CHANNELS] = {5, 18, 19};

const int freq = 5000;
const int resolution = 8;

// PWM 强度
const int PWM_PEAK = 255;   // 收缩期
const int PWM_VALLEY = 200; // 舒张期
const int PWM_OFF = 0;

// 心跳周期比例
const float SYSTOLE_RATIO = 0.35f;
const float DIASTOLE_RATIO = 0.65f;

// 每个通道的状态（初始为 0，表示未绑定 / 不跳动）
int heartRate[NUM_CHANNELS] = {0, 0, 0};

unsigned long beatInterval[NUM_CHANNELS] = {0, 0, 0};
unsigned long systoleDuration[NUM_CHANNELS] = {0, 0, 0};
unsigned long diastoleDuration[NUM_CHANNELS] = {0, 0, 0};
unsigned long phaseStartTime[NUM_CHANNELS] = {0, 0, 0};

bool isBeating[NUM_CHANNELS] = {false, false, false};
bool isPeak[NUM_CHANNELS] = {false, false, false};

// 串口输入缓冲 用于非阻塞读取
String serialBuffer;

// 设置某个通道的心率
void setHeartRateForChannel(int ch, int bpm)
{
  if (bpm <= 0)
  {
    isBeating[ch] = false;
    ledcWrite(pwmPins[ch], PWM_OFF);
    return;
  }

  heartRate[ch] = bpm;
  beatInterval[ch] = 60000UL / heartRate[ch];
  systoleDuration[ch] = (unsigned long)(beatInterval[ch] * SYSTOLE_RATIO);
  diastoleDuration[ch] = (unsigned long)(beatInterval[ch] * DIASTOLE_RATIO);

  isBeating[ch] = true;
  isPeak[ch] = true;
  phaseStartTime[ch] = millis();
  ledcWrite(pwmPins[ch], PWM_PEAK);
}

// 处理一整行串口指令
void handleCommand(String line)
{
  line.trim();
  if (line.length() == 0)
    return;

  // 全部关闭
  if (line.equalsIgnoreCase("off"))
  {
    for (int ch = 0; ch < NUM_CHANNELS; ch++)
    {
      isBeating[ch] = false;
      ledcWrite(pwmPins[ch], PWM_OFF);
    }
    Serial.println("全部通道已关闭");
    return;
  }

  // 全部恢复
  if (line.equalsIgnoreCase("on"))
  {
    for (int ch = 0; ch < NUM_CHANNELS; ch++)
    {
      setHeartRateForChannel(ch, heartRate[ch]);
    }
    Serial.println("全部通道已恢复跳动");
    return;
  }

  // 判断是否为“单个 BPM 值”（例如云端 bridge.py 发来的 "83"）
  int spaceIndex = line.indexOf(' ');
  if (spaceIndex <= 0)
  {
    int bpm = line.toInt();
    if (bpm < 0 || bpm > 200)
    {
      Serial.println("心率需在 0~200 之间");
      return;
    }

    // 这里做一个简单的“3 个不同心率”的映射：
    // ch0 比较慢，ch1 为实际值，ch2 稍微快一点
    int bpm0 = max(0, bpm - 20);
    int bpm1 = bpm;
    int bpm2 = min(200, bpm + 20);

    setHeartRateForChannel(0, bpm0);
    setHeartRateForChannel(1, bpm1);
    setHeartRateForChannel(2, bpm2);

    Serial.print("收到云端 BPM=");
    Serial.print(bpm);
    Serial.print(" 映射为: ch0=");
    Serial.print(bpm0);
    Serial.print(" ch1=");
    Serial.print(bpm1);
    Serial.print(" ch2=");
    Serial.println(bpm2);
    return;
  }

  // 单个通道设置  格式: 通道 空格 心率
  int ch = line.substring(0, spaceIndex).toInt();
  int bpm = line.substring(spaceIndex + 1).toInt();

  if (ch >= 0 && ch < NUM_CHANNELS && bpm >= 0 && bpm <= 200)
  {
    setHeartRateForChannel(ch, bpm);
    Serial.print("通道 ");
    Serial.print(ch);
    Serial.print(" 心率设置为 ");
    Serial.print(bpm);
    Serial.println(" BPM");
  }
  else
  {
    Serial.println("通道零到二 心率零到二百");
  }
}

void setup()
{
  Serial.begin(115200);

  for (int i = 0; i < NUM_CHANNELS; i++)
  {
    ledcAttach(pwmPins[i], freq, resolution);
    ledcWrite(pwmPins[i], PWM_OFF);
  }

  // 初始不启动任何通道，等待绑定用户后通过串口指令设置 BPM 再开始跳动
  Serial.println("三个电磁铁心跳模拟已启动（默认全部关闭，等待绑定用户后开始跳动）");
  Serial.println("可输入:");
  Serial.println(" 0 75    代表通道零设为七十五");
  Serial.println(" on      全部恢复跳动");
  Serial.println(" off     全部停止");
}

void loop()
{
  unsigned long now = millis();

  // 更新三个通道
  for (int ch = 0; ch < NUM_CHANNELS; ch++)
  {
    if (!isBeating[ch] || heartRate[ch] <= 0)
      continue;

    unsigned long elapsed = now - phaseStartTime[ch];

    if (isPeak[ch])
    {
      if (elapsed >= systoleDuration[ch])
      {
        isPeak[ch] = false;
        phaseStartTime[ch] = now;
        ledcWrite(pwmPins[ch], PWM_VALLEY);
      }
    }
    else
    {
      if (elapsed >= diastoleDuration[ch])
      {
        isPeak[ch] = true;
        phaseStartTime[ch] = now;
        ledcWrite(pwmPins[ch], PWM_PEAK);
      }
    }
  }

  // 非阻塞串口读取和命令解析
  while (Serial.available() > 0)
  {
    char c = Serial.read();

    if (c == '\n' || c == '\r')
    {
      serialBuffer.trim();
      if (serialBuffer.length() > 0)
      {
        handleCommand(serialBuffer);
      }
      serialBuffer = "";
    }
    else
    {
      serialBuffer += c;
    }
  }
}
