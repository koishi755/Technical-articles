---
pubDate: "2025/11/20"
---

# インストール

以下のAWSの記事を参照

<a href="https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html" target="_blank" rel=”noopener”>
    AWS CLI の最新バージョンのインストールまたは更新
</a>

<br>
<br>

## TLS通信の許可

公式の「irm https://awscli.amazonaws.com/v2/install.ps1 | iex」を実行すると「SSL/TLS のセキュリティで保護されているチャネルを作成できませんでした」というエラーになりました。

![](./img/Windows_install-01.png)

<br>

以下のコマンドで、TLS1.2通信を許可します。


```.ps1
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
```

![](./img/Windows_install-02.png)

<br>
<br>

## AWS CLIのインストール

AWS CLIをインストールします。

```.ps1
irm https://awscli.amazonaws.com/v2/install.ps1 | iex
```

![](./img/Windows_install-03.png)

![](./img/Windows_install-04.png)

<br>

インストール終了後パスを通します。

```.ps1
$awsPath = Join-Path $env:LOCALAPPDATA "Programs\Amazon\AWSCLIV2"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;$awsPath", "User")
```

![](./img/Windows_install-05.png)

<br>

AWS CLIのバージョンが表示されればOKです。
```.ps1
aws --version
```

![](./img/Windows_install-06.png)